"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  submitDocumentForReviewAction,
  createDocumentVersionAction,
  getSignedDocumentUrlAction,
  withdrawDocumentAction,
  verifyDocumentChecksumAction,
  AssignedSignatoryStep,
} from "@/actions/documents";
import {
  assignedSignatoryApproveAction,
  rejectReturnAction,
  rejectCloseAction,
} from "@/actions/approvals";
import SignaturePadModal from "@/components/SignaturePadModal";
import VisualStampPlacerModal, { StampCoordinates } from "@/components/VisualStampPlacerModal";
import { useOptionalToast } from "@/components/ToastContext";
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
  Undo2,
  Fingerprint,
  Crosshair,
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
    fullName?: string;
    firstName?: string;
    lastName?: string;
  };
}

export default function DocumentDetailActions({
  document,
  currentUser,
}: DocumentDetailActionsProps) {
  const router = useRouter();
  const toast = useOptionalToast();
  const showToast = toast?.showToast;

  const [comments, setComments] = useState("");
  const [signatureApplied, setSignatureApplied] = useState(true);

  // Electronic Signature state
  const [hasSignature, setHasSignature] = useState(!!currentUser.signaturePath);
  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState(false);

  // Precision Visual Stamp Placement state
  const [isPlacerModalOpen, setIsPlacerModalOpen] = useState(false);
  const [customCoordinates, setCustomCoordinates] = useState<StampCoordinates | null>(null);

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

  // Checksum verification state
  const [isVerifyingChecksum, setIsVerifyingChecksum] = useState(false);
  const [checksumResult, setChecksumResult] = useState<{
    isValid: boolean;
    calculated: string;
  } | null>(null);

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
      const res = await getSignedDocumentUrlAction(
        document.currentVersion.storagePath,
        document.id,
        "DOWNLOAD"
      );
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

  const handleVerifyChecksum = async () => {
    if (!document.id) return;
    setIsVerifyingChecksum(true);
    setError(null);
    setChecksumResult(null);

    try {
      const res = await verifyDocumentChecksumAction(document.id);
      if (res.success && res.calculatedChecksum) {
        setChecksumResult({
          isValid: !!res.isValid,
          calculated: res.calculatedChecksum,
        });
        if (res.isValid) {
          setSuccessMessage("Cryptographic SHA-256 integrity verified against storage binary.");
          if (showToast) {
            showToast({
              title: "SHA-256 Hash Verified",
              message: "Storage binary matches immutable cryptographic checksum.",
              type: "success",
            });
          }
        } else {
          setError("Integrity Warning: Binary checksum does not match registered database record.");
          if (showToast) {
            showToast({
              title: "Integrity Warning",
              message: "Storage binary does not match registered checksum.",
              type: "error",
            });
          }
        }
      } else {
        setError(res.error || "Failed to verify checksum.");
      }
    } catch {
      setError("Error performing checksum verification.");
    } finally {
      setIsVerifyingChecksum(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm("Are you sure you want to recall this document back to Draft? Reviewers will be notified.")) {
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const res = await withdrawDocumentAction(document.id);
      if (!res.success) {
        setError(res.error || "Failed to recall document.");
      } else {
        setSuccessMessage("Document recalled back to Draft for editing.");
        if (showToast) {
          showToast({
            title: "Document Recalled",
            message: "Document returned to Draft state for editing.",
            type: "info",
          });
        }
        router.refresh();
      }
    } catch {
      setError("Error recalling document.");
    } finally {
      setIsLoading(false);
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
        if (showToast) {
          showToast({
            title: "Submitted for Review",
            message: "Document entered sequential signatory pipeline.",
            type: "success",
          });
        }
        router.refresh();
      }
    } catch {
      setError("Network error submitting document.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (signatureApplied && !hasSignature) {
      if (
        confirm(
          "You haven't registered your institutional signature yet. Would you like to draw or upload your signature now before approving?"
        )
      ) {
        setIsSignaturePadOpen(true);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await assignedSignatoryApproveAction({
        documentId: document.id,
        comments,
        signatureApplied,
        customCoordinates: customCoordinates ? { page: customCoordinates.page, x: customCoordinates.x, y: customCoordinates.y } : null,
      });

      if (!res.success) {
        setError(res.error || "Approval failed.");
      } else {
        setSuccessMessage("Electronic signature stamped & approval recorded!");
        if (showToast) {
          showToast({
            title: "Approval Recorded",
            message: "E-Signature stamped and document advanced in workflow.",
            type: "success",
          });
        }
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
        if (showToast) {
          showToast({
            title: "Returned for Revision",
            message: "Uploader notified with rework remarks.",
            type: "warning",
          });
        }
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
        if (showToast) {
          showToast({
            title: "Document Rejected",
            message: "Terminal status recorded and document closed.",
            type: "error",
          });
        }
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

    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError("File exceeds the maximum allowable size of 25MB.");
      setNewVersionFile(null);
      setNewVersionChecksum(null);
      e.target.value = "";
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only official PDF documents (*.pdf) are supported for version uploads.");
      setNewVersionFile(null);
      setNewVersionChecksum(null);
      e.target.value = "";
      return;
    }

    setNewVersionFile(file);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      setNewVersionChecksum(hashHex);
      setError(null);
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
        <div className="p-4.5 rounded-2xl bg-red-50/95 border border-red-200/90 flex items-start gap-3 text-red-900 text-xs font-bold shadow-xs animate-shake">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4.5 rounded-2xl bg-emerald-50/95 border border-emerald-200/90 flex items-start gap-3 text-emerald-900 text-xs font-bold shadow-xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Sequential Signatory Workflow Stepper */}
      {flow.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/90 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2.5">
              <Users className="w-4.5 h-4.5 text-blue-600" />
              <span>Assigned Signatory Routing Pipeline</span>
            </h2>
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {document.status === DocumentStatus.APPROVED
                ? "Fully Signed & Stamped"
                : `Step ${(document.currentSignatoryIndex || 0) + 1} of ${flow.length}`}
            </span>
          </div>

          {/* Stepper with Connector Lines */}
          <div className="overflow-x-auto pb-3">
            <div className="flex items-start min-w-max gap-1">
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
                      className={`flex flex-col items-center w-40 px-3 pt-3 pb-4 rounded-2xl border transition-all duration-300 ${
                        isDone
                          ? "bg-emerald-50/80 border-emerald-300 shadow-xs"
                          : isCurrent
                          ? "bg-blue-50/90 border-blue-400 ring-4 ring-blue-500/20 shadow-md scale-102"
                          : "bg-slate-50/70 border-slate-200 opacity-60"
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 shadow-xs ${
                        isDone ? "bg-emerald-100 text-emerald-700" : isCurrent ? "bg-blue-600 text-white animate-pulse" : "bg-slate-200 text-slate-500"
                      }`}>
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isCurrent ? (
                          <PenLine className="w-4.5 h-4.5" />
                        ) : (
                          <Clock className="w-4.5 h-4.5" />
                        )}
                      </div>

                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
                        Step {idx + 1}
                      </span>
                      <span className="font-extrabold text-xs text-slate-900 text-center leading-tight">
                        {step.fullName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium text-center leading-tight mt-1">
                        {step.title || step.role}
                      </span>

                      {isDone ? (
                        <span className="mt-2 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Signed & Stamped
                        </span>
                      ) : isCurrent ? (
                        <span className="mt-2 text-[10px] font-bold text-blue-800 bg-blue-100/90 px-2.5 py-0.5 rounded-full border border-blue-300 animate-pulse">
                          Active Review Turn
                        </span>
                      ) : (
                        <span className="mt-2 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          Waiting
                        </span>
                      )}
                    </div>

                    {/* Connector */}
                    {idx < flow.length - 1 && (
                      <div className="flex items-center mt-6 mx-1">
                        <div className={`h-1 w-6 rounded-full ${isDone ? "bg-emerald-400" : "bg-slate-200"}`} />
                        <div className={`w-2.5 h-2.5 rotate-45 border-t-2 border-r-2 -ml-1.5 ${isDone ? "border-emerald-500" : "border-slate-300"}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Download & Integrity Action Bar */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/90 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
              Active Binary File (v{document.currentVersion?.versionNumber || 1})
            </span>
            <span className="font-extrabold text-slate-900 text-sm block mt-1">
              {document.currentVersion?.fileName || "document.pdf"}
            </span>
            {document.currentVersion?.sha256Checksum && (
              <span className="text-[11px] font-mono text-slate-400 block mt-0.5 truncate max-w-md">
                SHA-256: {document.currentVersion.sha256Checksum}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleVerifyChecksum}
              disabled={isVerifyingChecksum}
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Fingerprint className="w-4 h-4 text-emerald-600" />
              <span>{isVerifyingChecksum ? "Calculating SHA-256..." : "Verify Hash Integrity"}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={downloadLoading}
              className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>{downloadLoading ? "Generating Signed URL..." : "Download File"}</span>
            </button>
          </div>
        </div>

        {checksumResult && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-medium border flex items-center gap-2.5 ${
              checksumResult.isValid
                ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                : "bg-red-50 text-red-900 border-red-300"
            }`}
          >
            {checksumResult.isValid ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <div className="overflow-hidden">
              <span className="font-bold">
                {checksumResult.isValid
                  ? "Binary Integrity Verified (Match): "
                  : "Integrity Warning (Mismatch): "}
              </span>
              <span className="font-mono text-[10px] break-all">{checksumResult.calculated}</span>
            </div>
          </div>
        )}
      </div>

      {/* Workflow Action Panel */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/90 space-y-5 shadow-sm">
        <h2 className="text-sm sm:text-base font-black text-slate-900 border-b border-slate-200/80 pb-4 flex items-center gap-2.5">
          <Lock className="w-5 h-5 text-blue-700" />
          <span>Workflow & Electronic Signature Actions</span>
        </h2>

        {/* 1. Uploader Submission & Versioning */}
        {(document.status === DocumentStatus.DRAFT ||
          document.status === DocumentStatus.REJECTED_RETURNED) &&
          isUploader && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {document.status === DocumentStatus.REJECTED_RETURNED
                  ? "This document was returned for rework. Upload a revised version (v2+) addressing reviewer feedback before resubmitting."
                  : "This document is in Draft status. Submit when ready to begin the sequential approval pipeline."}
              </p>

              <div className="flex flex-wrap gap-3.5">
                <button
                  onClick={handleSubmitForReview}
                  disabled={isLoading}
                  className="px-5 py-3 rounded-xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5 active:scale-98 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>Submit for Sequential Review</span>
                </button>

                <button
                  onClick={() => setShowVersionModal(true)}
                  className="px-5 py-3 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-bold shadow-xs hover:shadow-md transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5 active:scale-98 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>
                    Upload Revised Version (v{(document.currentVersion?.versionNumber || 1) + 1})
                  </span>
                </button>
              </div>
            </div>
          )}

        {/* 1B. Uploader Recall / Withdrawal when document is currently awaiting review */}
        {isPendingApproval && isUploader && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-extrabold text-slate-900 block">
                Submitted Document Awaiting Review
              </span>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                Need to make immediate corrections? You can recall this document back to Draft before signatories take action.
              </span>
            </div>
            <button
              onClick={handleWithdraw}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Recall to Draft</span>
            </button>
          </div>
        )}

        {/* 2. Active Assigned Signatory Approval Box */}
        {canApprove && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200/80">
              <span className="text-xs font-black text-blue-950 block">
                It is your turn to review and sign this document
              </span>
              <span className="text-xs text-blue-800 block mt-1">
                Your registered institutional electronic signature will be stamped on approval.
              </span>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Reviewer Endorsement & Comments (Mandatory for returns)
              </label>
              <textarea
                rows={3}
                placeholder="Enter remarks, endorsements, or line-item revision feedback..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="block w-full px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F2962] transition-all shadow-inner"
              />
            </div>

            {/* E-Signature Status Banner & Precision Stamp Placement */}
            <div className="p-4 rounded-2xl border flex flex-col gap-3.5 bg-slate-50/80 border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0F2962] flex items-center justify-center shrink-0 shadow-xs">
                    <PenLine className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {hasSignature ? "Electronic Signature Registered" : "No Signature on File"}
                    </span>
                    <span className="text-[11px] text-slate-500 block font-medium">
                      {hasSignature
                        ? "Ready to apply cryptographic stamp on approval."
                        : "Draw or upload your signature before finalizing review."}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSignaturePadOpen(true)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-[#0F2962] font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <PenLine className="w-3.5 h-3.5" />
                    <span>{hasSignature ? "Edit Signature" : "Draw Signature"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPlacerModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl border border-blue-300 bg-blue-50/80 hover:bg-blue-100 text-[#0F2962] font-black text-xs shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    title="Open precision stamp placement canvas"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-blue-600" />
                    <span>{customCoordinates ? "Adjust Placement" : "Set Stamp Position"}</span>
                  </button>
                </div>
              </div>

              {/* Placement Coordinate Feedback Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Crosshair className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  {customCoordinates ? (
                    <span>
                      Target: <strong>Page {customCoordinates.page + 1}</strong> (X: {customCoordinates.x}pt, Y: {customCoordinates.y}pt)
                    </span>
                  ) : (
                    <span>
                      Target: <strong className="text-emerald-700">🎯 Smart Auto-Detect Active</strong> (Matches name line & skips blank pages)
                    </span>
                  )}
                </div>
                {customCoordinates && (
                  <button
                    type="button"
                    onClick={() => setCustomCoordinates(null)}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    Reset to Auto
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={signatureApplied}
                  onChange={(e) => setSignatureApplied(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#0F2962] focus:ring-[#0F2962]"
                />
                <span>Stamp Electronic Signature on Document & Sign Audit Trail</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3.5 pt-2">
              <button
                onClick={handleApprove}
                disabled={isLoading}
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5 active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve & Stamp E-Signature</span>
              </button>

              <button
                onClick={handleRejectReturn}
                disabled={isLoading}
                className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5 active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Return for Revision</span>
              </button>

              <button
                onClick={handleRejectClose}
                disabled={isLoading}
                className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-red-700 border border-red-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel / Reject</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Awaiting Other Signatory */}
        {isPendingApproval && !canApprove && (
          <div className="p-4.5 rounded-2xl bg-slate-50/90 border border-slate-200 flex items-center gap-3.5 text-slate-700 text-xs">
            <Clock className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 block">
                Awaiting review from:{" "}
                {document.currentSignatory
                  ? `${document.currentSignatory.firstName} ${document.currentSignatory.lastName} (${document.currentSignatory.role})`
                  : "Next Assigned Signatory"}
              </span>
              <span className="text-slate-500 block mt-0.5">
                The document will automatically advance to the subsequent signatory once approved.
              </span>
            </div>
          </div>
        )}

        {/* 4. Fully Approved */}
        {document.status === DocumentStatus.APPROVED && (
          <div className="p-4.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex items-center gap-3.5 text-emerald-950 text-xs shadow-xs">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <span className="font-black text-sm block">This document is fully approved and cryptographically sealed.</span>
              <span className="text-emerald-800 block mt-0.5">
                All sequential electronic signatures have been embedded and the SHA-256 digest is locked.
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

      {/* Precision Visual Stamp Placement Modal */}
      <VisualStampPlacerModal
        isOpen={isPlacerModalOpen}
        onClose={() => setIsPlacerModalOpen(false)}
        documentId={document.id}
        storagePath={document.currentVersion?.storagePath}
        currentUser={{
          fullName: currentUser.fullName || `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() || "Signatory",
          role: currentUser.role,
          signaturePath: currentUser.signaturePath,
        }}
        initialCoordinates={customCoordinates}
        onConfirm={(newCoords) => {
          setCustomCoordinates(newCoords);
          if (showToast) {
            showToast({
              title: "Stamp Position Configured",
              message: `Placement locked to Page ${newCoords.page + 1} (X: ${newCoords.x}pt, Y: ${newCoords.y}pt)`,
              type: "success",
            });
          }
        }}
      />

      {/* New Version Upload Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="glass-panel rounded-3xl p-7 max-w-lg w-full bg-white shadow-2xl space-y-5 border border-white/90 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2.5">
                <Upload className="w-5 h-5 text-blue-600" />
                <span>Upload Revised Version (v{(document.currentVersion?.versionNumber || 1) + 1})</span>
              </h3>
              <button
                onClick={() => setShowVersionModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadNewVersion} className="space-y-4.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Change Summary / Revisions Made *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Summarize the adjustments made in this revision..."
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  className="block w-full px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F2962] transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  New Document File (Official PDF Document, Max 25 MB) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,application/pdf"
                  onChange={handleNewVersionFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#0F2962] hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              {newVersionChecksum && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                  <span className="font-bold block">New Version SHA-256:</span>
                  <code className="font-mono text-[10px] break-all">{newVersionChecksum}</code>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowVersionModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !newVersionFile}
                  className="px-5 py-2.5 rounded-xl bg-[#0F2962] hover:bg-[#091a42] text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? "Uploading..." : "Save New Version"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="glass-panel rounded-3xl p-7 max-w-md w-full bg-white shadow-2xl space-y-5 border border-red-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 shadow-sm">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Terminally Close & Reject</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  This action is <strong>irreversible</strong>. The document will be permanently rejected.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
              <span className="text-[11px] font-bold text-red-800 block uppercase tracking-wider mb-1">
                Stated Reason
              </span>
              <p className="text-xs text-red-900 italic font-medium">&ldquo;{comments}&rdquo;</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedClose}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Confirm Closure</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
