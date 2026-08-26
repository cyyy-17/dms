"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDocumentAction, AssignedSignatoryStep } from "@/actions/documents";
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
} from "lucide-react";
import { getRoleLabel, formatFileSize } from "@/lib/status-labels";

interface DocTypeOption {
  id: string;
  code: string;
  name: string;
  requiresExpiryTracking: boolean;
  defaultApprovalLevel: string;
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

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [documentTypeId, setDocumentTypeId] = useState(docTypes[0]?.id || "");
  const [unitId, setUnitId] = useState(currentUserUnitId || units[0]?.id || "");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [fileChecksum, setFileChecksum] = useState<string | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Assigned Signatory Flow State
  const [signatoryChain, setSignatoryChain] = useState<AssignedSignatoryStep[]>([]);

  const [selectedUserToAdd, setSelectedUserToAdd] = useState<string>("");
  const [selectedTitleToAdd, setSelectedTitleToAdd] = useState<string>("Recommending Approval");

  const selectedDocType = docTypes.find((d) => d.id === documentTypeId);

  // Compute SHA-256 checksum on file selection with instant client validation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate size (25MB limit)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE) {
      setError("File exceeds the maximum allowable size of 25MB.");
      setFile(null);
      setFileChecksum(null);
      e.target.value = "";
      return;
    }

    // Validate PDF MIME/extension
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

  const handleMoveStep = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= signatoryChain.length) return;

    const newChain = [...signatoryChain];
    const temp = newChain[index];
    newChain[index] = newChain[targetIndex];
    newChain[targetIndex] = temp;

    const reordered = newChain.map((step, idx) => ({ ...step, stepOrder: idx }));
    setSignatoryChain(reordered);
  };

  const handleRemoveStep = (index: number) => {
    const filtered = signatoryChain.filter((_, idx) => idx !== index);
    const reordered = filtered.map((step, idx) => ({ ...step, stepOrder: idx }));
    setSignatoryChain(reordered);
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
        title,
        description,
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
  const completedStepsCount = (isStep1Done ? 1 : 0) + (isStep2Done ? 1 : 0) + (isStep3Done ? 1 : 0);
  const progressPercent = Math.round((completedStepsCount / 3) * 100);

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto">
      {/* 🚀 Multi-Stage Workflow Progress Stepper */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
              Document Ingestion Pipeline
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900">
              Form Progress: {progressPercent}% Completed ({completedStepsCount} of 3 Stages)
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-[#0F2962] bg-blue-50 border border-blue-200 px-3 py-1 rounded-full w-fit">
            {progressPercent === 100 ? "Ready for Cryptographic Ingestion" : "Draft In Progress"}
          </span>
        </div>

        {/* Visual Progress Bar Track */}
        <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            className="h-full rounded-full bg-linear-to-r from-[#0F2962] via-blue-600 to-amber-400 transition-all duration-500 shadow-sm"
            style={{ width: `${Math.max(progressPercent, 5)}%` }}
          />
        </div>

        {/* 3 Step Indicator Nodes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
          <div className={`p-2.5 rounded-xl border transition-all flex items-center gap-2.5 ${
            isStep1Done ? "bg-emerald-50/80 border-emerald-300 text-emerald-900" : "bg-slate-50 border-slate-200 text-slate-600"
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
              isStep1Done ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-700"
            }`}>
              {isStep1Done ? "✓" : "1"}
            </span>
            <div className="min-w-0">
              <span className="font-bold block truncate">1. Classification</span>
              <span className="text-[10px] text-slate-500 truncate block">Title & Unit Metadata</span>
            </div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all flex items-center gap-2.5 ${
            isStep2Done ? "bg-emerald-50/80 border-emerald-300 text-emerald-900" : "bg-slate-50 border-slate-200 text-slate-600"
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
              isStep2Done ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-700"
            }`}>
              {isStep2Done ? "✓" : "2"}
            </span>
            <div className="min-w-0">
              <span className="font-bold block truncate">2. Signatory Chain</span>
              <span className="text-[10px] text-slate-500 truncate block">
                {signatoryChain.length} Signer(s) Assigned
              </span>
            </div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all flex items-center gap-2.5 ${
            isStep3Done ? "bg-emerald-50/80 border-emerald-300 text-emerald-900" : "bg-slate-50 border-slate-200 text-slate-600"
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
              isStep3Done ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-700"
            }`}>
              {isStep3Done ? "✓" : "3"}
            </span>
            <div className="min-w-0">
              <span className="font-bold block truncate">3. PDF & SHA-256</span>
              <span className="text-[10px] text-slate-500 truncate block">
                {isStep3Done ? "Checksum Verified" : "Awaiting PDF"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4.5 rounded-2xl bg-rose-50/95 border border-rose-200/90 flex items-center gap-3 text-rose-900 text-xs font-bold shadow-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Metadata Box */}
      <div className="glass-panel rounded-3xl p-5 sm:p-8 border border-white/90 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-[#0F2962]" />
            <span>1. Document Classification & Metadata</span>
          </h2>
          <span className="text-xs font-mono font-bold text-slate-400">Step 1 of 3</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {/* Classification Taxonomy */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
              Document Type *
            </label>
            <select
              value={documentTypeId}
              onChange={(e) => setDocumentTypeId(e.target.value)}
              className="block w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition-all shadow-inner"
            >
              {docTypes.map((dt) => (
                <option key={dt.id} value={dt.id} className="text-slate-900 bg-white">
                  {dt.name} ({dt.code})
                </option>
              ))}
            </select>
          </div>

          {/* Unit Scope */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
              Originating Unit *
            </label>
            <select
              value={unitId}
              disabled={!isCrossUnit}
              onChange={(e) => setUnitId(e.target.value)}
              className="block w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition-all shadow-inner disabled:bg-slate-100 disabled:text-slate-500"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id} className="text-slate-900 bg-white">
                  {u.name} ({u.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
            Official Document Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. MOA Partnership Agreement - Industry Partner Inc."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="block w-full px-4 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition-all shadow-inner placeholder:text-slate-400"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
            Description & Context (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Provide context, parties involved, or key objectives for reviewer reference..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full px-4 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition-all shadow-inner placeholder:text-slate-400"
          />
        </div>

        {/* Validity Dates */}
        <div className="grid sm:grid-cols-2 gap-5 pt-1">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
              Effective Date (Optional)
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="block w-full pl-10 pr-3.5 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition-all shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
              Expiry Date {selectedDocType?.requiresExpiryTracking && "(Required for Automated Alerts)"}
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="block w-full pl-10 pr-3.5 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition-all shadow-inner"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Assigned Signatory Workflow Builder */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/90 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-4 gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2.5">
              <Users className="w-5 h-5 text-blue-600" />
              <span>2. Sequential Signatory Pipeline</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Define the sequential order of reviewers required to apply electronic signatures.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">Step 2 of 3</span>
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {signatoryChain.length === 0 ? (
            <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300/90 text-center bg-slate-50/70">
              <UserCheck className="w-9 h-9 text-slate-400 mx-auto mb-2" />
              <span className="text-xs font-bold text-slate-700 block">No Signatories Configured</span>
              <span className="text-[11px] text-slate-500">
                Add signatories below to define the sequential review chain.
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {signatoryChain.map((step, idx) => (
                <div
                  key={step.userId}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/90 bg-white/80 hover:bg-blue-50/40 hover:border-blue-300 transition-all duration-200 shadow-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-linear-to-br from-[#0F2962] to-[#1E40AF] text-amber-400 font-black text-xs flex items-center justify-center shadow-sm shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">{step.fullName}</span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100/90 text-blue-900 border border-blue-200">
                          {getRoleLabel(step.role)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium block mt-0.5">
                        Signatory Line: <strong className="text-slate-800">{step.title}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveStep(idx, "up")}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition cursor-pointer"
                      title="Move Step Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === signatoryChain.length - 1}
                      onClick={() => handleMoveStep(idx, "down")}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition cursor-pointer"
                      title="Move Step Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(idx)}
                      className="p-2 rounded-lg hover:bg-rose-100 text-rose-600 transition ml-1 cursor-pointer"
                      title="Remove Signatory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add User Controls */}
        <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-3.5">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-700" />
            <span>Add Signatory to Sequential Pipeline</span>
          </span>

          <div className="grid sm:grid-cols-5 gap-3.5">
            <div className="sm:col-span-3">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Select Institutional User
              </label>
              <select
                value={selectedUserToAdd}
                onChange={(e) => setSelectedUserToAdd(e.target.value)}
                className="block w-full px-3.5 py-2.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F2962] transition-all shadow-inner"
              >
                <option value="" className="text-slate-900 bg-white">-- Choose Signer --</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id} className="text-slate-900 bg-white">
                    {u.fullName} ({u.role} {u.unitCode ? `• ${u.unitCode}` : ""})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Signatory Title
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Approved by, Reviewed"
                  value={selectedTitleToAdd}
                  onChange={(e) => setSelectedTitleToAdd(e.target.value)}
                  className="block w-full px-3.5 py-2.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F2962] transition-all shadow-inner placeholder:text-slate-400"
                />
                <button
                  type="button"
                  disabled={!selectedUserToAdd}
                  onClick={handleAddSignatory}
                  className="px-4 py-2.5 rounded-xl bg-[#0F2962] text-white font-bold text-xs hover:bg-[#091a42] disabled:opacity-50 transition-all shadow-sm shrink-0 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. File Upload Box */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/90 space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2.5">
            <UploadCloud className="w-5 h-5 text-emerald-600" />
            <span>3. Document File & Integrity Checksum (v1)</span>
          </h2>
          <span className="text-xs font-mono font-bold text-slate-400">Step 3 of 3</span>
        </div>

        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-all bg-slate-50/70 hover:bg-blue-50/20">
          <input
            type="file"
            id="docFile"
            accept=".pdf,.docx,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="docFile" className="cursor-pointer block space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0F2962] flex items-center justify-center mx-auto shadow-sm">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div className="text-sm font-bold text-slate-800">
              {file ? (
                <span className="text-[#0F2962] font-black">{file.name} ({formatFileSize(file.size)})</span>
              ) : (
                <span>Click to select document or drag and drop file here</span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Supported formats: PDF, Word (.docx), Excel (.xlsx) • Max 50 MB
            </p>
          </label>
        </div>

        {/* Checksum Display */}
        {fileChecksum && (
          <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex items-start gap-3 text-emerald-950 text-xs shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="font-extrabold">RA 10173 Cryptographic Integrity Checksum:</span>
              <code className="block font-mono text-[11px] text-emerald-900 break-all mt-1 bg-emerald-100/70 p-2 rounded-xl border border-emerald-200">
                SHA-256: {fileChecksum}
              </code>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-3.5 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all shadow-xs cursor-pointer text-center"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isHashing || !file}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white font-bold text-xs shadow-lg shadow-blue-950/20 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-50 hover:-translate-y-0.5 active:scale-98 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Ingesting Document...</span>
            </>
          ) : (
            <>
              <span>Save & Register Document (v1)</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
