"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createDocumentAction,
  checkDuplicateDocumentAction,
  AssignedSignatoryStep,
} from "@/actions/documents";
import { getDocTypeTemplateDownloadUrlAction } from "@/actions/templates";
import {
  UploadCloud,
  ShieldCheck,
  Calendar,
  AlertCircle,
  ArrowRight,
  UserCheck,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Building2,
  Users,
  Loader2,
  FileDown,
} from "lucide-react";
import { getRoleLabel, formatFileSize } from "@/lib/status-labels";

interface DocTypeOption {
  id: string;
  code: string;
  name: string;
  requiresExpiryTracking: boolean;
  defaultApprovalLevel?: string;
}

interface UnitOption {
  id: string;
  code: string;
  name: string;
}

export interface AvailableUserOption {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: string;
  unitCode?: string | null;
  unitName?: string | null;
}

export default function DocumentUploadForm({
  docTypes,
  units,
  currentUserUnitId,
  isCrossUnit,
  availableUsers = [],
}: {
  docTypes: DocTypeOption[];
  units: UnitOption[];
  currentUserUnitId: string | null;
  isCrossUnit: boolean;
  availableUsers?: AvailableUserOption[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  // Step 1: Metadata
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [documentTypeId, setDocumentTypeId] = useState(docTypes[0]?.id || "");
  const [unitId, setUnitId] = useState(currentUserUnitId || units[0]?.id || "");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  // Step 2: Signatory Chain
  const [signatoryChain, setSignatoryChain] = useState<AssignedSignatoryStep[]>([]);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<string>("");
  const [selectedTitleToAdd, setSelectedTitleToAdd] = useState<string>("Recommending Approval");

  // Step 3: PDF File
  const [file, setFile] = useState<File | null>(null);
  const [fileChecksum, setFileChecksum] = useState<string | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || trimmedTitle.length < 4 || !unitId) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await checkDuplicateDocumentAction(trimmedTitle, unitId);
        if (res.isDuplicate && res.existingDocument) {
          setDuplicateWarning(
            `Notice: An active document with matching title "${res.existingDocument.title}" (${res.existingDocument.trackingNumber} - ${res.existingDocument.status}) is already recorded in this unit.`
          );
        } else {
          setDuplicateWarning(null);
        }
      } catch {
        // Ignore network glitch
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [title, unitId]);

  const activeDuplicateWarning = title.trim().length >= 4 ? duplicateWarning : null;

  const selectedDocType = docTypes.find((d) => d.id === documentTypeId);
  const selectedUnit = units.find((u) => u.id === unitId);

  // File selection and SHA-256 computation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const MAX_SIZE = 25 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE) {
      setError("File exceeds the maximum allowable size of 25MB.");
      setFile(null);
      setFileChecksum(null);
      e.target.value = "";
      return;
    }

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Only official PDF documents are supported for ingestion.");
      setFile(null);
      setFileChecksum(null);
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
    setIsHashing(true);
    setError(null);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      setFileChecksum(hashHex);
    } catch {
      setError("Failed to compute cryptographic file checksum.");
    } finally {
      setIsHashing(false);
    }
  };

  const [isCheckingTemplate, setIsCheckingTemplate] = useState(false);

  const handleDownloadTemplate = async () => {
    const selectedDocType = docTypes.find((d) => d.id === documentTypeId);
    if (!selectedDocType) return;
    setIsCheckingTemplate(true);
    setError(null);
    try {
      const res = await getDocTypeTemplateDownloadUrlAction(selectedDocType.code);
      if (res.success && res.downloadUrl && typeof window !== "undefined") {
        const a = window.document.createElement("a");
        a.href = res.downloadUrl;
        a.download = `${selectedDocType.code}_template.pdf`;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
      } else {
        setError(`No official blank template is uploaded yet for ${selectedDocType.name}.`);
      }
    } catch {
      setError("Failed to retrieve document template.");
    } finally {
      setIsCheckingTemplate(false);
    }
  };

  // Add signatory step
  const handleAddSignatory = () => {
    if (!selectedUserToAdd) return;
    const userObj = availableUsers.find((u) => u.id === selectedUserToAdd);
    if (!userObj) return;

    if (signatoryChain.some((s) => s.userId === userObj.id)) {
      setError(`${userObj.fullName} is already assigned in the sequential chain.`);
      return;
    }

    const newStep: AssignedSignatoryStep = {
      userId: userObj.id,
      fullName: userObj.fullName,
      role: userObj.role,
      title: selectedTitleToAdd,
      stepOrder: signatoryChain.length,
      status: "PENDING",
    };

    setSignatoryChain([...signatoryChain, newStep]);
    setSelectedUserToAdd("");
    setError(null);
  };

  const handleMoveStep = (index: number, moveDirection: "up" | "down") => {
    const targetIndex = moveDirection === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= signatoryChain.length) return;

    const newChain = [...signatoryChain];
    const temp = newChain[index];
    newChain[index] = newChain[targetIndex];
    newChain[targetIndex] = temp;

    const reordered = newChain.map((stepItem, idx) => ({ ...stepItem, stepOrder: idx }));
    setSignatoryChain(reordered);
  };

  const handleRemoveStep = (index: number) => {
    const filtered = signatoryChain.filter((_, idx) => idx !== index);
    const reordered = filtered.map((stepItem, idx) => ({ ...stepItem, stepOrder: idx }));
    setSignatoryChain(reordered);
  };

  // Wizard Step Navigation
  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Please provide an Official Document Title.");
      return;
    }
    if (!documentTypeId) {
      setError("Please select a Document Type.");
      return;
    }
    if (selectedDocType?.requiresExpiryTracking && !expiryDate) {
      setError(`Expiry Date is mandatory for ${selectedDocType.name} classification.`);
      return;
    }
    setDirection("forward");
    setStep(2);
  };

  const handleStep2Next = () => {
    setError(null);
    setDirection("forward");
    setStep(3);
  };

  const handleBack = () => {
    setError(null);
    setDirection("backward");
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !fileChecksum) {
      setError("Please choose a valid document file to ingest.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64String = Buffer.from(arrayBuffer).toString("base64");

      const res = await createDocumentAction({
        title: title.trim(),
        description: description.trim() || undefined,
        documentTypeId,
        unitId: isCrossUnit ? unitId : undefined,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        fileBufferBase64: base64String,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/pdf",
        sha256Checksum: fileChecksum,
        signatoryFlow: signatoryChain.length > 0 ? signatoryChain : undefined,
      });

      if (res.success && res.documentId) {
        router.push(`/dashboard/documents/${res.documentId}`);
        router.refresh();
      } else {
        setError(res.error || "Failed to create document.");
      }
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStep1Done = title.trim().length > 0 && !!documentTypeId && !!unitId;
  const isStep2Done = signatoryChain.length > 0;
  const isStep3Done = !!file && !!fileChecksum;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* 🚀 Multi-Stage Sliding Progress Stepper */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/90 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100/90 text-blue-900 text-xs font-mono font-bold border border-blue-200 shadow-xs">
              Stage {step} of 3
            </span>
            <span className="text-sm font-extrabold text-slate-900">
              {step === 1 && "1. Classification & Metadata"}
              {step === 2 && "2. Sequential Signatory Pipeline"}
              {step === 3 && "3. PDF Ingestion & Cryptographic Verification"}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-[#0F2962] bg-blue-50 border border-blue-200 px-3 py-1 rounded-full w-fit">
            {step === 1 ? "33% • Classification" : step === 2 ? "66% • Signatory Routing" : "100% • Verification Ready"}
          </span>
        </div>

        {/* Visual Progress Bar Track */}
        <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            className="h-full rounded-full bg-linear-to-r from-[#0F2962] via-blue-600 to-amber-400 transition-all duration-500 shadow-sm"
            style={{ width: `${step === 1 ? 33 : step === 2 ? 66 : 100}%` }}
          />
        </div>

        {/* 3 Clickable Step Pills */}
        <div className="grid grid-cols-3 gap-2 pt-0.5 text-xs">
          <button
            type="button"
            onClick={() => {
              setDirection(step > 1 ? "backward" : "forward");
              setStep(1);
            }}
            className={`p-2 rounded-xl border transition-all flex items-center gap-2 text-left cursor-pointer ${
              step === 1
                ? "bg-blue-50/90 border-blue-400 ring-2 ring-blue-400/20 text-blue-950 font-bold"
                : isStep1Done
                ? "bg-emerald-50/80 border-emerald-300 text-emerald-900 font-semibold"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                step === 1
                  ? "bg-[#0F2962] text-white"
                  : isStep1Done
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-300 text-slate-700"
              }`}
            >
              {isStep1Done && step !== 1 ? "✓" : "1"}
            </span>
            <span className="truncate hidden sm:inline">1. Classification</span>
            <span className="truncate sm:hidden">1. Metadata</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isStep1Done) {
                setDirection(step > 2 ? "backward" : "forward");
                setStep(2);
              }
            }}
            disabled={!isStep1Done}
            className={`p-2 rounded-xl border transition-all flex items-center gap-2 text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              step === 2
                ? "bg-blue-50/90 border-blue-400 ring-2 ring-blue-400/20 text-blue-950 font-bold"
                : isStep2Done
                ? "bg-emerald-50/80 border-emerald-300 text-emerald-900 font-semibold"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                step === 2
                  ? "bg-[#0F2962] text-white"
                  : isStep2Done
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-300 text-slate-700"
              }`}
            >
              {isStep2Done && step !== 2 ? "✓" : "2"}
            </span>
            <span className="truncate hidden sm:inline">2. Signatories</span>
            <span className="truncate sm:hidden">2. Routing</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isStep1Done) {
                setDirection("forward");
                setStep(3);
              }
            }}
            disabled={!isStep1Done}
            className={`p-2 rounded-xl border transition-all flex items-center gap-2 text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              step === 3
                ? "bg-blue-50/90 border-blue-400 ring-2 ring-blue-400/20 text-blue-950 font-bold"
                : isStep3Done
                ? "bg-emerald-50/80 border-emerald-300 text-emerald-900 font-semibold"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                step === 3
                  ? "bg-[#0F2962] text-white"
                  : isStep3Done
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-300 text-slate-700"
              }`}
            >
              {isStep3Done && step !== 3 ? "✓" : "3"}
            </span>
            <span className="truncate hidden sm:inline">3. PDF & Checksum</span>
            <span className="truncate sm:hidden">3. File Ingest</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-900 text-xs font-bold shadow-sm animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* STEP 1: Document Classification & Metadata */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <form
          onSubmit={handleStep1Next}
          key="step-1"
          className={`glass-panel rounded-2xl p-5 sm:p-6 border border-white/90 space-y-4 shadow-sm animate-in fade-in ${
            direction === "forward" ? "slide-in-from-right-4" : "slide-in-from-left-4"
          } duration-200`}
        >
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0F2962]" />
              <span>Classification & Department Tenancy</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">Step 1 of 3</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Document Type *
              </label>
              <select
                value={documentTypeId}
                onChange={(e) => setDocumentTypeId(e.target.value)}
                className="block w-full px-3 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F2962] transition-all shadow-inner"
              >
                {docTypes.map((dt) => (
                  <option key={dt.id} value={dt.id} className="text-slate-900 bg-white">
                    {dt.name} ({dt.code})
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-between pt-1.5 px-0.5">
                <span className="text-[10px] text-slate-500 font-medium">Standard template</span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={isCheckingTemplate}
                  className="text-[11px] font-bold text-[#0F2962] hover:text-blue-700 flex items-center gap-1 cursor-pointer hover:underline disabled:opacity-50"
                  title="Download blank official template for this document classification"
                >
                  {isCheckingTemplate ? (
                    <Loader2 className="w-3 h-3 animate-spin text-[#0F2962]" />
                  ) : (
                    <FileDown className="w-3 h-3 text-blue-600" />
                  )}
                  <span>Download Blank PDF</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Originating Unit *
              </label>
              <select
                value={unitId}
                disabled={!isCrossUnit}
                onChange={(e) => setUnitId(e.target.value)}
                className="block w-full px-3 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F2962] transition-all shadow-inner disabled:bg-slate-100 disabled:text-slate-500"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id} className="text-slate-900 bg-white">
                    {u.name} ({u.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Official Document Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. MOA Partnership Agreement - Industry Partner Inc."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full px-3.5 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F2962] transition-all shadow-inner placeholder:text-slate-400"
            />
            {activeDuplicateWarning && (
              <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-tight">{activeDuplicateWarning}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Description &amp; Context (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Provide context, parties involved, or key objectives for reviewer reference..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full px-3.5 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F2962] transition-all shadow-inner placeholder:text-slate-400"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3.5 pt-0.5">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Effective Date (Optional)
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F2962] transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Expiry Date {selectedDocType?.requiresExpiryTracking && "(Required for Alerts)"}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F2962] transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#0F2962] hover:bg-[#091a42] text-white font-bold text-xs shadow-md shadow-blue-950/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Continue to Signatory Chain</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </form>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* STEP 2: Sequential Signatory Pipeline */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div
          key="step-2"
          className={`glass-panel rounded-2xl p-5 sm:p-6 border border-white/90 space-y-4 shadow-sm animate-in fade-in ${
            direction === "forward" ? "slide-in-from-right-4" : "slide-in-from-left-4"
          } duration-200`}
        >
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Sequential Signatory Pipeline</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Designate reviewer sequence. If none assigned, standard unit workflow applies.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Step 2 of 3</span>
          </div>

          {/* Steps List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {signatoryChain.length === 0 ? (
              <div className="p-5 rounded-xl border-2 border-dashed border-slate-300 text-center bg-slate-50/70">
                <UserCheck className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
                <span className="text-xs font-bold text-slate-700 block">Default Approval Policy</span>
                <span className="text-[11px] text-slate-500">
                  You may proceed with standard unit routing or add specific custom signatories below.
                </span>
              </div>
            ) : (
              signatoryChain.map((stepItem, idx) => (
                <div
                  key={stepItem.userId}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-[#0F2962] text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{stepItem.fullName}</span>
                        <span className="text-[9.5px] font-bold px-2 py-0.2 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                          {getRoleLabel(stepItem.role)}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Line: <strong className="text-slate-800">{stepItem.title}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveStep(idx, "up")}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === signatoryChain.length - 1}
                      onClick={() => handleMoveStep(idx, "down")}
                      className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(idx)}
                      className="p-1.5 rounded hover:bg-rose-100 text-rose-600 transition ml-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add User Tool */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2.5">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-700" />
              <span>Add Signatory to Chain</span>
            </span>

            <div className="grid sm:grid-cols-5 gap-2.5">
              <div className="sm:col-span-3">
                <select
                  value={selectedUserToAdd}
                  onChange={(e) => setSelectedUserToAdd(e.target.value)}
                  className="block w-full px-2.5 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F2962]"
                >
                  <option value="" className="text-slate-900 bg-white">-- Choose Signer --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id} className="text-slate-900 bg-white">
                      {u.fullName} ({u.role} {u.unitCode ? `• ${u.unitCode}` : ""})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 flex gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. Approved by"
                  value={selectedTitleToAdd}
                  onChange={(e) => setSelectedTitleToAdd(e.target.value)}
                  className="block w-full px-2.5 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400"
                />
                <button
                  type="button"
                  disabled={!selectedUserToAdd}
                  onClick={handleAddSignatory}
                  className="px-3 py-1.5 rounded-lg bg-[#0F2962] text-white font-bold text-xs hover:bg-[#091a42] disabled:opacity-50 transition shrink-0 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              ← Back to Metadata
            </button>
            <button
              type="button"
              onClick={handleStep2Next}
              className="px-5 py-2.5 rounded-xl bg-[#0F2962] hover:bg-[#091a42] text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <span>Continue to File Upload</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* STEP 3: Document File Ingestion & Checksum */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <form
          onSubmit={handleSubmit}
          key="step-3"
          className={`glass-panel rounded-2xl p-5 sm:p-6 border border-white/90 space-y-4 shadow-sm animate-in fade-in ${
            direction === "forward" ? "slide-in-from-right-4" : "slide-in-from-left-4"
          } duration-200`}
        >
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>Document File &amp; Cryptographic SHA-256 Ingestion</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">Step 3 of 3</span>
          </div>

          {/* Pre-Flight Metadata Summary Pill */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block font-medium">Title</span>
              <span className="font-bold text-slate-900 truncate block">{title}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Doc Type</span>
              <span className="font-bold text-slate-900 truncate block">{selectedDocType?.name}</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-slate-400 block font-medium">Target Unit</span>
              <span className="font-bold text-slate-900 truncate block">{selectedUnit?.name}</span>
            </div>
          </div>

          {/* File Picker Dropzone */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition bg-slate-50/70 hover:bg-blue-50/20">
            <input
              type="file"
              id="docFile"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="docFile" className="cursor-pointer block space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0F2962] flex items-center justify-center mx-auto shadow-xs">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-800">
                {file ? (
                  <span className="text-[#0F2962] font-black">{file.name} ({formatFileSize(file.size)})</span>
                ) : (
                  <span>Click to select PDF or drag and drop file here</span>
                )}
              </div>
              <p className="text-[10.5px] text-slate-500">
                Official PDF Format (*.pdf) • Maximum 25 MB
              </p>
            </label>
          </div>

          {/* Checksum Display */}
          {fileChecksum && (
            <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 flex items-start gap-2.5 text-emerald-950 text-xs shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-extrabold text-[11px]">RA 10173 Cryptographic Integrity Verified:</span>
                <code className="block font-mono text-[10px] text-emerald-900 break-all mt-0.5 bg-emerald-100/70 p-1.5 rounded-lg border border-emerald-200">
                  SHA-256: {fileChecksum}
                </code>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer disabled:opacity-50"
            >
              ← Back to Signatories
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isHashing || !file}
              className="px-6 py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-950/20 hover:shadow-xl transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Ingesting Document...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>Ingest &amp; Register Document (v1)</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
