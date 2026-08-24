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
} from "lucide-react";

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

  // Signatory Flow State (Lazily initialized with default Coordinator + Director)
  const [signatoryChain, setSignatoryChain] = useState<AssignedSignatoryStep[]>(() => {
    const defaultChain: AssignedSignatoryStep[] = [];
    if (availableUsers.length > 0) {
      const initialUnitId = currentUserUnitId || units[0]?.id || "";
      const currentUnitCode = units.find((un) => un.id === initialUnitId)?.code;

      const unitCoord = availableUsers.find(
        (u) => (u.unitCode === currentUnitCode || u.role === "COORDINATOR") && u.role === "COORDINATOR"
      );
      if (unitCoord) {
        defaultChain.push({
          userId: unitCoord.id,
          fullName: unitCoord.fullName,
          role: unitCoord.role,
          title: "Recommending Approval",
          stepOrder: 0,
          status: "PENDING",
        });
      }

      const director = availableUsers.find((u) => u.role === "DIRECTOR");
      if (director && (!unitCoord || director.id !== unitCoord.id)) {
        defaultChain.push({
          userId: director.id,
          fullName: director.fullName,
          role: director.role,
          title: "Approved by",
          stepOrder: defaultChain.length,
          status: "PENDING",
        });
      }
    }
    return defaultChain;
  });

  const [selectedUserToAdd, setSelectedUserToAdd] = useState<string>("");
  const [selectedTitleToAdd, setSelectedTitleToAdd] = useState<string>("Recommending Approval");

  const selectedDocType = docTypes.find((d) => d.id === documentTypeId);

  // Compute SHA-256 checksum on file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

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
      setError("Failed to compute file integrity checksum.");
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
      setError(`${userObj.fullName} is already in the signatory chain.`);
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

  // Move step up / down
  const handleMoveStep = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= signatoryChain.length) return;

    const newChain = [...signatoryChain];
    const temp = newChain[index];
    newChain[index] = newChain[targetIndex];
    newChain[targetIndex] = temp;

    // Recalculate stepOrder
    const reordered = newChain.map((step, idx) => ({ ...step, stepOrder: idx }));
    setSignatoryChain(reordered);
  };

  // Remove step
  const handleRemoveStep = (index: number) => {
    const filtered = signatoryChain.filter((_, idx) => idx !== index);
    const reordered = filtered.map((step, idx) => ({ ...step, stepOrder: idx }));
    setSignatoryChain(reordered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !fileChecksum) {
      setError("Please select a document file to upload.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Convert file to Base64
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
      } else {
        setError(res.error || "Failed to create document.");
      }
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-xs font-semibold animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Metadata Box */}
      <div className="glass-card rounded-2xl p-6 sm:p-7 border border-slate-200/90 space-y-5 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#0F2962]" />
            <span>1. Document Classification & Context</span>
          </h2>
          <span className="text-[11px] font-mono font-semibold text-slate-400">Step 1 of 3</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {/* Classification Taxonomy */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Document Type *
            </label>
            <select
              value={documentTypeId}
              onChange={(e) => setDocumentTypeId(e.target.value)}
              className="block w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition bg-white"
            >
              {docTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.name} ({dt.code})
                </option>
              ))}
            </select>
          </div>

          {/* Unit Scope */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Originating Unit *
            </label>
            <select
              value={unitId}
              disabled={!isCrossUnit}
              onChange={(e) => setUnitId(e.target.value)}
              className="block w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition bg-white disabled:bg-slate-100 disabled:text-slate-500"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Official Document Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. MOA Partnership Agreement - Ayala Land Inc."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="block w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition bg-white"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Description & Objectives (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Provide context, parties involved, or key objectives for reviewer reference..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition bg-white"
          />
        </div>

        {/* Validity Dates */}
        <div className="grid sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Effective Date (Optional)
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Expiry Date {selectedDocType?.requiresExpiryTracking && "(Recommended for Alerts)"}
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Assigned Signatory Workflow Builder */}
      <div className="glass-card rounded-2xl p-6 sm:p-7 border border-slate-200/90 space-y-5 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>2. Assigned Signatory Workflow (Sequential E-Sign Flow)</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select specific users to review and sign this document in exact turn-based order.
            </p>
          </div>
          <span className="text-[11px] font-mono font-semibold text-slate-400">Step 2 of 3</span>
        </div>

        {/* Visual Signatory Steps List */}
        <div className="space-y-3">
          {signatoryChain.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-slate-300 text-center bg-slate-50/60">
              <UserCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <span className="text-xs font-bold text-slate-700 block">No Assigned Signatories Configured</span>
              <span className="text-[11px] text-slate-500">
                Add signatories below to define the sequential review chain.
              </span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {signatoryChain.map((step, idx) => (
                <div
                  key={step.userId}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#0F2962] text-amber-400 font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{step.fullName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                          {step.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        Signatory Line: <strong className="text-slate-700">{step.title}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveStep(idx, "up")}
                      className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition"
                      title="Move Step Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === signatoryChain.length - 1}
                      onClick={() => handleMoveStep(idx, "down")}
                      className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition"
                      title="Move Step Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(idx)}
                      className="p-1.5 rounded-md hover:bg-rose-100 text-rose-600 transition ml-1"
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

        {/* Add User to Chain Controls */}
        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Add Next Assigned Signatory to Chain</span>
          </span>

          <div className="grid sm:grid-cols-5 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Select User Profile
              </label>
              <select
                value={selectedUserToAdd}
                onChange={(e) => setSelectedUserToAdd(e.target.value)}
                className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#0F2962]"
              >
                <option value="">-- Choose Institutional User --</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.role} {u.unitCode ? `• ${u.unitCode}` : ""})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Signatory Line Title
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Approved by, Reviewed"
                  value={selectedTitleToAdd}
                  onChange={(e) => setSelectedTitleToAdd(e.target.value)}
                  className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#0F2962]"
                />
                <button
                  type="button"
                  disabled={!selectedUserToAdd}
                  onClick={handleAddSignatory}
                  className="px-3.5 py-2 rounded-lg bg-[#0F2962] text-white font-bold text-xs hover:bg-[#091a42] disabled:opacity-50 transition shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. File Upload Box */}
      <div className="glass-card rounded-2xl p-6 sm:p-7 border border-slate-200/90 space-y-4 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-emerald-600" />
            <span>3. Document Binary & Integrity Verification (v1)</span>
          </h2>
          <span className="text-[11px] font-mono font-semibold text-slate-400">Step 3 of 3</span>
        </div>

        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition bg-slate-50/50">
          <input
            type="file"
            id="docFile"
            accept=".pdf,.docx,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="docFile" className="cursor-pointer block space-y-2">
            <UploadCloud className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="text-xs font-semibold text-slate-700">
              {file ? (
                <span className="text-[#0F2962] font-bold">{file.name}</span>
              ) : (
                <span>Click to select document or drag file here</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Supported formats: PDF, Microsoft Word (.docx), Excel (.xlsx) • Max 50 MB
            </p>
          </label>
        </div>

        {/* SHA-256 Checksum Preview */}
        {fileChecksum && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-900 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">RA 10173 Cryptographic Integrity Hash:</span>
              <code className="block font-mono text-[10px] text-emerald-800 break-all mt-0.5 bg-emerald-100/60 p-1.5 rounded">
                SHA-256: {fileChecksum}
              </code>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isHashing || !file}
          className="px-6 py-2.5 rounded-lg bg-[#0F2962] hover:bg-[#091a42] text-white font-semibold text-xs shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Ingesting Document...</span>
          ) : (
            <>
              <span>Save as Draft (v1)</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
