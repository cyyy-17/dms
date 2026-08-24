"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  submitDocumentForReviewAction,
  createDocumentVersionAction,
  getSignedDocumentUrlAction,
  AssignedSignatoryStep,
} from "@/actions/documents";
import {
  assignedSignatoryApproveAction,
  rejectReturnAction,
  rejectCloseAction,
} from "@/actions/approvals";
import SignaturePadModal from "@/components/SignaturePadModal";
import {
  Send,
  CheckCircle,
  RotateCcw,
  XCircle,
  Download,
  Upload,
  AlertCircle,
  Lock,
  PenLine,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { DocumentStatus, UserRole } from "@prisma/client";

interface DocumentDetailActionsProps {
  document: {
    id: string;
    trackingNumber: string;
    status: DocumentStatus;
    uploaderId: string;
    unitId: string;
    isEscalated: boolean;
    rejectionCount: number;
    signatoryFlow?: AssignedSignatoryStep[] | unknown;
    currentSignatoryId?: string | null;
    currentSignatoryIndex?: number;
    currentSignatory?: { id: string; firstName: string; lastName: string; role: string; email: string } | null;
    currentVersion: {
      id: string;
      versionNumber: number;
      storagePath: string;
      fileName: string;
      sha256Checksum: string;
    } | null;
  };
  currentUser: {
    id: string;
    role: UserRole;
    unitId: string | null;
    signaturePath: string | null;
  };
}

export default function DocumentDetailActions({
  document,
  currentUser,
}: DocumentDetailActionsProps) {
  const router = useRouter();

  const [comments, setComments] = useState("");
  const [signatureApplied, setSignatureApplied] = useState(true);

  // Electronic Signature state
  const [hasSignature, setHasSignature] = useState(!!currentUser.signaturePath);
  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState(false);

  // New Version Modal state
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [changeSummary, setChangeSummary] = useState("");
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [newVersionChecksum, setNewVersionChecksum] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const flow: AssignedSignatoryStep[] = Array.isArray(document.signatoryFlow)
    ? (document.signatoryFlow as AssignedSignatoryStep[])
    : [];

  const isUploader = currentUser.id === document.uploaderId;
  const isCurrentAssignedSigner = currentUser.id === document.currentSignatoryId;
  const isAdmin = currentUser.role === "ADMIN";

  const isCoordinator =
    currentUser.role === "ADMIN" ||
    (currentUser.role === "COORDINATOR" && currentUser.unitId === document.unitId);
  const isDirector = currentUser.role === "DIRECTOR" || currentUser.role === "ADMIN";

  const isPendingApproval =
    document.status === DocumentStatus.PENDING_COORDINATOR ||
    document.status === DocumentStatus.PENDING_DIRECTOR;

  const canApprove =
    isPendingApproval &&
    (isCurrentAssignedSigner ||
      isAdmin ||
      (flow.length === 0 && (isCoordinator || isDirector)));

  const handleDownload = async () => {
    if (!document.currentVersion?.storagePath) return;
    setDownloadLoading(true);
    setError(null);

    try {
      const res = await getSignedDocumentUrlAction(document.currentVersion.storagePath);
      if (res.success && res.signedUrl) {
        window.open(res.signedUrl, "_blank");
      } else {
        setError(res.error || "Failed to generate signed download link.");
      }
    } catch {
      setError("Error downloading file.");
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await submitDocumentForReviewAction(document.id);
      if (!res.success) {
        setError(res.error || "Failed to submit document.");
      } else {
        setSuccessMessage("Document submitted for sequential review.");
        router.refresh();
      }
    } catch {
      setError("Network error submitting document.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await assignedSignatoryApproveAction({
        documentId: document.id,
        comments,
        signatureApplied,
      });

      if (!res.success) {
        setError(res.error || "Approval failed.");
      } else {
        setSuccessMessage("Electronic signature stamped & approval recorded!");
        router.refresh();
      }
    } catch {
      setError("Network error approving document.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectReturn = async () => {
    if (!comments.trim()) {
      setError("Comments are strictly mandatory when returning a document for revision.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await rejectReturnAction({
        documentId: document.id,
        comments,
      });

      if (!res.success) {
        setError(res.error || "Failed to return document.");
      } else {
        setSuccessMessage("Document returned to uploader for revision.");
        router.refresh();
      }
    } catch {
      setError("Network error returning document.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectClose = async () => {
    if (!comments.trim()) {
      setError("Reason for terminal cancellation is mandatory.");
      return;
    }
    setShowCloseConfirm(true);
  };

  const handleConfirmedClose = async () => {
    setShowCloseConfirm(false);
    setIsLoading(true);
    setError(null);

    try {
      const res = await rejectCloseAction({
        documentId: document.id,
        comments,
      });

      if (!res.success) {
        setError(res.error || "Failed to close document.");
      } else {
        setSuccessMessage("Document closed and rejected.");
        router.refresh();
      }
    } catch {
      setError("Network error closing document.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewVersionFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewVersionFile(file);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      setNewVersionChecksum(hashHex);
    } catch {
      setError("Failed to compute SHA-256 for revised version.");
    }
  };

  const handleUploadNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionFile || !newVersionChecksum || !changeSummary.trim()) {
      setError("All fields (file, summary) are required for a revised version upload.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const arrayBuffer = await newVersionFile.arrayBuffer();
      const base64String = Buffer.from(arrayBuffer).toString("base64");

      const res = await createDocumentVersionAction({
        documentId: document.id,
        changeSummary,
        fileBufferBase64: base64String,
        fileName: newVersionFile.name,
        fileSize: newVersionFile.size,
        mimeType: newVersionFile.type || "application/octet-stream",
        sha256Checksum: newVersionChecksum,
      });

      if (!res.success) {
        setError(res.error || "Failed to upload new version.");
      } else {
        setSuccessMessage("New immutable version uploaded successfully!");
        setShowVersionModal(false);
        router.refresh();
      }
    } catch {
      setError("Network error uploading new version.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs font-medium animate-shake">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-xs font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Sequential Signatory Workflow Progress Track */}
      {flow.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-slate-200 bg-white space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Assigned Signatory Routing Flow</span>
            </h2>
            <span className="text-[11px] font-mono font-semibold text-slate-500">
              {document.status === DocumentStatus.APPROVED
                ? "Fully Signed & Sealed"
                : `Step ${(document.currentSignatoryIndex || 0) + 1} of ${flow.length}`}
            </span>
          </div>

          {/* 3E: Horizontal Stepper with Connector Lines */}
          <div className="overflow-x-auto pb-2">
            <div className="flex items-start min-w-max gap-0">
              {flow.map((step, idx) => {
                const isCurrent =
                  isPendingApproval &&
                  (document.currentSignatoryIndex ?? 0) === idx;
                const isDone =
                  step.status === "APPROVED" ||
                  (!isPendingApproval &&
                    document.status === DocumentStatus.APPROVED);

                return (
                  <div key={step.userId} className="flex items-start">
                    {/* Step Card */}
                    <div
                      className={`flex flex-col items-center w-36 px-2 pt-2 pb-3 rounded-xl border transition-all ${
                        isDone
                          ? "bg-emerald-50/70 border-emerald-200"
                          : isCurrent
                          ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 shadow-xs"
                          : "bg-slate-50 border-slate-200 opacity-60"
                      }`}
                    >
                      {/* Status Icon */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                        isDone ? "bg-emerald-100" : isCurrent ? "bg-blue-100 animate-pulse" : "bg-slate-200"
                      }`}>
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : isCurrent ? (
                          <PenLine className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>

                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                        Step {idx + 1}
                      </span>
                      <span className="font-bold text-[11px] text-slate-900 text-center leading-tight">
                        {step.fullName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium text-center leading-tight mt-0.5">
                        {step.title || step.role}
                      </span>

                      {isDone ? (
                        <span className="mt-1.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Signed
                        </span>
                      ) : isCurrent ? (
                        <span className="mt-1.5 text-[9px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          Active Turn
                        </span>
                      ) : (
                        <span className="mt-1.5 text-[9px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Waiting
                        </span>
                      )}
                    </div>

                    {/* Connector Line */}
                    {idx < flow.length - 1 && (
                      <div className="flex items-center mt-4 mx-1">
                        <div className={`h-0.5 w-6 rounded-full ${isDone ? "bg-emerald-300" : "bg-slate-200"}`} />
                        <div className={`w-2 h-2 rotate-45 border-t-2 border-r-2 -ml-1 ${isDone ? "border-emerald-400" : "border-slate-300"}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Download Action */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Active Binary File (v{document.currentVersion?.versionNumber || 1})
          </span>
          <span className="font-semibold text-slate-900 text-sm block mt-0.5">
            {document.currentVersion?.fileName || "document.pdf"}
          </span>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloadLoading}
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>{downloadLoading ? "Generating Signed URL..." : "Download File (15m)"}</span>
        </button>
      </div>

      {/* State-Dependent Action Panel */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200 space-y-4 bg-white shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-700" />
          <span>Workflow & Electronic Signature Actions</span>
        </h2>

        {/* 1. Uploader Submission & Versioning Controls */}
        {(document.status === DocumentStatus.DRAFT ||
          document.status === DocumentStatus.REJECTED_RETURNED) &&
          isUploader && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                {document.status === DocumentStatus.REJECTED_RETURNED
                  ? "This document was returned for revision. Upload a new version (v2+) addressing the reviewer comments before resubmitting."
                  : "This document is currently in Draft state. Submit for review when ready."}
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSubmitForReview}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-lg bg-[#0F2962] hover:bg-[#091a42] text-white text-xs font-semibold shadow-md transition flex items-center gap-2"
                >
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>Submit for Assigned Sequential Review</span>
                </button>

                <button
                  onClick={() => setShowVersionModal(true)}
                  className="px-5 py-2.5 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-semibold shadow-sm transition flex items-center gap-2"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>
                    Upload Revised Version (v{(document.currentVersion?.versionNumber || 1) + 1})
                  </span>
                </button>
              </div>
            </div>
          )}

        {/* 2. Active Assigned Signatory Approval Box */}
        {canApprove && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-xs font-bold text-blue-950 block">
                It is your turn to review and sign this document
              </span>
              <span className="text-[11px] text-blue-800 block mt-0.5">
                Your electronic signature will be automatically scanned and stamped above your printed name.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Reviewer Endorsement & Comments (Optional for Approval, Mandatory for Return)
              </label>
              <textarea
                rows={3}
                placeholder="Enter endorsement remarks, required revisions, or feedback..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="block w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F2962] bg-white"
              />
            </div>

            {/* E-Signature Status Banner */}
            <div className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-[#0F2962] flex items-center justify-center shrink-0">
                  <PenLine className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {hasSignature ? "Electronic Signature Registered" : "No Signature on File"}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {hasSignature
                      ? "Your signature is ready to stamp above your name in the document."
                      : "Draw or upload your signature before finalizing approval."}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSignaturePadOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-[#0F2962] font-bold text-xs shadow-sm transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
              >
                <PenLine className="w-3.5 h-3.5" />
                <span>{hasSignature ? "Edit / Re-draw Signature" : "Draw / Upload Signature"}</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={signatureApplied}
                  onChange={(e) => setSignatureApplied(e.target.checked)}
                  className="rounded border-slate-300 text-[#0F2962] focus:ring-[#0F2962]"
                />
                <span className="font-semibold">
                  Stamp Electronic Signature on Document & Sign Audit Trail
                </span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleApprove}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve & Stamp E-Signature</span>
              </button>

              <button
                onClick={handleRejectReturn}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Return for Revision (Comments Required)</span>
              </button>

              <button
                onClick={handleRejectClose}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-red-700 border border-red-200 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel / Reject Document</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Awaiting Other Signatory Notice */}
        {isPendingApproval && !canApprove && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-slate-700 text-xs">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold block">
                Awaiting signature from:{" "}
                {document.currentSignatory
                  ? `${document.currentSignatory.firstName} ${document.currentSignatory.lastName} (${document.currentSignatory.role})`
                  : "Next Assigned Signatory"}
              </span>
              <span className="text-[11px] text-slate-500 block">
                The document will automatically advance to the next step once approved.
              </span>
            </div>
          </div>
        )}

        {/* 4. Fully Approved Banner */}
        {document.status === DocumentStatus.APPROVED && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">This document is fully approved and sealed.</span>
              <span className="text-[11px] text-emerald-700 block">
                All electronic signatures have been embedded and the cryptographic hash is locked.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Signature Pad Modal */}
      <SignaturePadModal
        isOpen={isSignaturePadOpen}
        onClose={() => setIsSignaturePadOpen(false)}
        onSignatureSaved={() => {
          setHasSignature(true);
          setIsSignaturePadOpen(false);
        }}
      />

      {/* New Version Upload Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="glass-card rounded-2xl p-6 max-w-lg w-full bg-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Upload Revised Version (v{(document.currentVersion?.versionNumber || 1) + 1})</span>
              </h3>
              <button
                onClick={() => setShowVersionModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadNewVersion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Change Summary / Revisions Made *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Summarize the adjustments made in this revision..."
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F2962]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  New Document File (PDF / Word / Excel) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.docx,.xlsx"
                  onChange={handleNewVersionFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#0F2962] hover:file:bg-blue-100"
                />
              </div>

              {newVersionChecksum && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px]">
                  <span className="font-bold block">New Version SHA-256:</span>
                  <code className="font-mono text-[10px] break-all">{newVersionChecksum}</code>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVersionModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !newVersionFile}
                  className="px-4 py-2 rounded-lg bg-[#0F2962] text-white font-semibold text-xs hover:bg-[#091a42] disabled:opacity-50"
                >
                  {isLoading ? "Uploading..." : "Save New Version"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1B: Proper Destructive Action Confirmation Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full bg-white shadow-2xl space-y-5 border border-red-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Terminally Close & Reject Document</h3>
                <p className="text-xs text-slate-600 mt-1">
                  This action is <strong>irreversible</strong>. The document will be permanently closed and locked.
                  The uploader will be notified with your stated reason.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
              <span className="text-[11px] font-bold text-red-800 block uppercase tracking-wider mb-1">
                Your Reason for Closure
              </span>
              <p className="text-xs text-red-900 italic">&ldquo;{comments}&rdquo;</p>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
              >
                Cancel — Keep Document
              </button>
              <button
                onClick={handleConfirmedClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                Confirm: Close & Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
