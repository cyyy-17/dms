"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  submitDocumentForReviewAction,
  createDocumentVersionAction,
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
  FileText,
  Copy,
  Check,
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
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Checksum verification state
  const [isVerifyingChecksum, setIsVerifyingChecksum] = useState(false);
  const [checksumResult, setChecksumResult] = useState<{
    isValid: boolean;
    calculated: string;
  } | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const handleCopyChecksum = () => {
    if (!document.currentVersion?.sha256Checksum) return;
    navigator.clipboard.writeText(document.currentVersion.sha256Checksum);
    setCopiedHash(true);
    if (showToast) {
      showToast({
        title: "SHA-256 Hash Copied",
        message: "Cryptographic hash copied to clipboard.",
        type: "info",
      });
    }
    setTimeout(() => setCopiedHash(false), 2000);
  };

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
    if (!document.id) return;
    setDownloadLoading(true);
    setError(null);

    try {
      if (typeof window !== "undefined") {
        const a = window.document.createElement("a");
        a.href = `/api/documents/${document.id}/download`;
        a.download = document.currentVersion?.fileName || "document.pdf";
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
      }
    } catch {
      setError("Error downloading watermarked file.");
    } finally {
      setTimeout(() => setDownloadLoading(false), 1500);
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

    if (signatureApplied && !customCoordinates) {
      setError("Please set the stamp location on the document before submitting your approval.");
      if (showToast) {
        showToast({
          title: "Stamp Location Required",
          message: "Please click on the document canvas to position your stamp before approving.",
          type: "warning",
        });
      }
      setIsPlacerModalOpen(true);
      return;
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

  const handleRejectReturn = () => {
    setError(null);
    setShowReturnModal(true);
  };

  const handleExecuteReturn = async () => {
    if (!comments.trim()) {
      setError("Revision remarks are strictly mandatory when returning a document.");
      if (showToast) {
        showToast({
          title: "Remarks Required",
          message: "Please enter specific remarks explaining what needs revision.",
          type: "warning",
        });
      }
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
        if (showToast) {
          showToast({
            title: "Return Failed",
            message: res.error || "Failed to return document.",
            type: "error",
          });
        }
      } else {
        setShowReturnModal(false);
        setSuccessMessage("Document returned to uploader for revision.");
        if (showToast) {
          showToast({
            title: "Returned for Revision",
            message: "Uploader notified with rework remarks to submit version v2+.",
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

  const handleRejectClose = () => {
    setError(null);
    setShowCloseConfirm(true);
  };

  const handleConfirmedClose = async () => {
    if (!comments.trim()) {
      setError("A stated reason is strictly mandatory for permanent cancellation.");
      if (showToast) {
        showToast({
          title: "Reason Required",
          message: "Please provide a reason before permanently closing this document.",
          type: "warning",
        });
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await rejectCloseAction({
        documentId: document.id,
        comments,
      });

      if (!res.success) {
        setError(res.error || "Failed to close document.");
        if (showToast) {
          showToast({
            title: "Rejection Failed",
            message: res.error || "Failed to close document.",
            type: "error",
          });
        }
      } else {
        setShowCloseConfirm(false);
        setSuccessMessage("Document terminally closed and rejected.");
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
        <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/90 space-y-4 shadow-sm bg-white/90">
          {/* Header & Progress Stats */}
          <div className="space-y-3 pb-3 border-b border-slate-200/80">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0F2962] flex items-center justify-center font-bold shadow-2xs">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-black text-slate-900 tracking-tight">
                    Sequential Approval Pipeline
                  </h2>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Institutional multi-tier sign-off route
                  </p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black font-mono shadow-2xs border ${
                document.status === DocumentStatus.APPROVED
                  ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                  : "bg-blue-50 text-blue-900 border-blue-200"
              }`}>
                {document.status === DocumentStatus.APPROVED
                  ? "✓ Fully Sealed"
                  : `Step ${(document.currentSignatoryIndex || 0) + 1} of ${flow.length}`}
              </span>
            </div>

            {/* Pipeline Visual Progress Bar */}
            {(() => {
              const approvedCount = flow.filter(
                (s) => s.status === "APPROVED" || document.status === DocumentStatus.APPROVED
              ).length;
              const percent = Math.round((approvedCount / flow.length) * 100);

              return (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span>Progress: {approvedCount} of {flow.length} Signatures</span>
                    <span className="font-mono text-[#0F2962]">{percent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-[#0F2962] via-blue-600 to-emerald-500 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Vertical Connected Stepper */}
          <div className="relative space-y-3 pt-1">
            {flow.map((step, idx) => {
              const isCurrent =
                isPendingApproval && (document.currentSignatoryIndex ?? 0) === idx;
              const isDone =
                step.status === "APPROVED" ||
                (!isPendingApproval && document.status === DocumentStatus.APPROVED);
              const isLast = idx === flow.length - 1;

              return (
                <div key={step.userId || idx} className="relative flex items-start gap-3">
                  {/* Vertical Connector Line */}
                  {!isLast && (
                    <div
                      className={`absolute left-4 top-8 -bottom-3 w-0.5 z-0 transition-colors duration-300 ${
                        isDone ? "bg-emerald-400" : "bg-slate-200"
                      }`}
                    />
                  )}

                  {/* Step Status Node */}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs transition-all duration-300 ${
                      isDone
                        ? "bg-emerald-500 text-white shadow-emerald-500/30"
                        : isCurrent
                        ? "bg-[#0F2962] text-amber-300 ring-4 ring-blue-500/20 shadow-md animate-pulse"
                        : "bg-slate-100 text-slate-400 border border-slate-300"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4.5 h-4.5" />
                    ) : isCurrent ? (
                      <PenLine className="w-4 h-4" />
                    ) : (
                      <span className="font-mono text-[11px] font-bold">{idx + 1}</span>
                    )}
                  </div>

                  {/* Step Detail Card */}
                  <div
                    className={`flex-1 min-w-0 p-3 rounded-2xl border transition-all duration-200 ${
                      isDone
                        ? "bg-emerald-50/50 border-emerald-200/80 shadow-2xs"
                        : isCurrent
                        ? "bg-blue-50/80 border-blue-300/90 shadow-sm ring-2 ring-blue-500/15"
                        : "bg-slate-50/50 border-slate-200/70 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        Step {idx + 1} • {step.role || "Signatory"}
                      </span>

                      {isDone ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Signed & Stamped
                        </span>
                      ) : isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-300 animate-pulse">
                          <Clock className="w-2.5 h-2.5 text-blue-700" />
                          Active Review Turn
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Upcoming
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-black text-slate-900 truncate">
                      {step.fullName}
                    </h3>

                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      {step.title || (step.role === "DIRECTOR" ? "Director Approval" : "Unit Review")}
                    </p>

                    {step.signedAt && (
                      <div className="mt-1.5 pt-1.5 border-t border-emerald-200/60 flex items-center gap-1 text-[10px] font-mono text-emerald-800">
                        <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          Verified: {new Date(step.signedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cryptographic Binary File & Hash Verification Card */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/90 space-y-4 shadow-sm bg-white/90">
        {/* Top: File Identity & Release Tags */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200/80 text-[#0F2962] flex items-center justify-center shrink-0 shadow-2xs font-bold mt-0.5">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Active Document Binary
              </span>
              <h3 className="font-black text-slate-900 text-sm truncate mt-0.5" title={document.currentVersion?.fileName || "document.pdf"}>
                {document.currentVersion?.fileName || "document.pdf"}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black font-mono bg-blue-50 text-[#0F2962] border border-blue-200 shadow-2xs">
                  v{document.currentVersion?.versionNumber || 1}.0 Release
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
                  PDF
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                  Current Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Cryptographic SHA-256 Vault */}
        {document.currentVersion?.sha256Checksum && (
          <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Fingerprint className="w-3.5 h-3.5 text-[#0F2962] shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Cryptographic SHA-256 Checksum
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyChecksum}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-[#0F2962] bg-white px-2 py-0.5 rounded-md border border-slate-200 hover:border-slate-300 shadow-2xs transition cursor-pointer"
                title="Copy full SHA-256 hash"
              >
                {copiedHash ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-white px-3 py-2 rounded-xl border border-slate-200/90 shadow-inner">
              <p className="font-mono text-[10px] text-slate-700 break-all select-all leading-relaxed">
                {document.currentVersion.sha256Checksum}
              </p>
            </div>
          </div>
        )}

        {/* Bottom: Action Command Deck */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handleDownload}
            disabled={downloadLoading}
            className="py-2.5 px-4 rounded-xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-98 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>{downloadLoading ? "Generating Link..." : "Download Signed File"}</span>
          </button>

          <button
            onClick={handleVerifyChecksum}
            disabled={isVerifyingChecksum}
            className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold shadow-2xs hover:shadow-xs transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-98 cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{isVerifyingChecksum ? "Hashing Binary..." : "Verify Hash Integrity"}</span>
          </button>
        </div>

        {/* Checksum Verification Result Alert */}
        {checksumResult && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-medium border flex items-start gap-2.5 animate-in fade-in duration-200 ${
              checksumResult.isValid
                ? "bg-emerald-50/90 text-emerald-950 border-emerald-300 shadow-2xs"
                : "bg-red-50 text-red-900 border-red-300"
            }`}
          >
            {checksumResult.isValid ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="overflow-hidden min-w-0">
              <span className="font-black block">
                {checksumResult.isValid
                  ? "✓ Cryptographic SHA-256 Match Verified"
                  : "⚠️ Integrity Warning (Checksum Mismatch)"}
              </span>
              <span className="text-[10px] text-slate-600 block mt-0.5">
                {checksumResult.isValid
                  ? "Binary in private vault matches the registered blockchain/audit record."
                  : "Storage binary does not match registered checksum."}
              </span>
              <span className="font-mono text-[9.5px] break-all block mt-1 text-slate-500 bg-white/80 p-1.5 rounded-lg border border-slate-200">
                {checksumResult.calculated}
              </span>
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
              {document.status === DocumentStatus.REJECTED_RETURNED ? (
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300/80 space-y-2.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-950 uppercase tracking-wider">
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    <span>Rework Cycle Active</span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    Review the revision remarks above, prepare your revised file, and click below to upload <strong>Version v{(document.currentVersion?.versionNumber || 1) + 1}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowVersionModal(true)}
                    className="w-full py-3 px-4 rounded-xl bg-[#0F2962] hover:bg-[#091a42] text-amber-300 text-xs font-black shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-98 cursor-pointer ring-2 ring-blue-500/20"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Revised PDF Version (v{(document.currentVersion?.versionNumber || 1) + 1})</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    This document is in Draft status. Submit when ready to begin the sequential approval pipeline.
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
          <div className="space-y-4 pt-1">
            {/* Active Turn Alert Banner */}
            <div className="p-4 rounded-2xl bg-linear-to-r from-blue-50 to-indigo-50/80 border border-blue-200/90 flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-[#0F2962] text-amber-400 flex items-center justify-center shrink-0 shadow-xs font-bold mt-0.5">
                <PenLine className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-black text-slate-900 block leading-tight">
                  It is your turn to review and sign this document
                </span>
                <span className="text-[11px] text-slate-600 font-medium block mt-1 leading-relaxed">
                  Your formal sign-off will apply an institutional verification seal, update the cryptographic SHA-256 hash, and route to the next step.
                </span>
              </div>
            </div>

            {/* Reviewer Remarks & Comments Input */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-black text-slate-700 uppercase tracking-wider">
                <span>Reviewer Endorsement & Remarks</span>
                <span className="text-[10px] font-normal lowercase text-slate-400">
                  (mandatory for returns)
                </span>
              </label>
              <textarea
                rows={3}
                placeholder="Enter remarks, endorsements, or line-item revision feedback for the uploader..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="block w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-2xl focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition-all shadow-inner placeholder:text-slate-400"
              />
            </div>

            {/* Unified E-Signature & Mandatory Stamp Placement Console */}
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/80 space-y-3.5 shadow-2xs">
              {/* Row 1: E-Signature Registered Status */}
              <div className="flex items-center justify-between gap-2.5 pb-3 border-b border-slate-200/70">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${hasSignature ? "bg-emerald-500 ring-4 ring-emerald-100" : "bg-amber-400 ring-4 ring-amber-100"}`} />
                  <div className="truncate">
                    <span className="text-xs font-black text-slate-900 block leading-tight truncate">
                      {hasSignature ? "Electronic Signature Registered" : "No Signature on File"}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block truncate">
                      {hasSignature ? "Official signature ready for application" : "Draw or upload to activate stamp"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSignaturePadOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] shadow-2xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <PenLine className="w-3 h-3 text-[#0F2962]" />
                  <span>{hasSignature ? "Edit Signature" : "Draw Signature"}</span>
                </button>
              </div>

              {/* Row 2: Mandatory Stamp Placement Status Card */}
              {customCoordinates ? (
                <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-black block leading-tight truncate">
                        Stamp Location Configured
                      </span>
                      <span className="text-[11px] font-mono text-emerald-800 block truncate mt-0.5">
                        Page {customCoordinates.page + 1} • X: {customCoordinates.x}pt, Y: {customCoordinates.y}pt
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsPlacerModalOpen(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-black text-[11px] shadow-2xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <Crosshair className="w-3 h-3 text-emerald-700" />
                      <span>Adjust Location</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomCoordinates(null)}
                      className="px-2 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-500 font-bold text-[11px] transition cursor-pointer"
                      title="Clear position"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-linear-to-r from-amber-50 to-blue-50 border-2 border-dashed border-blue-400 text-slate-900 space-y-2 shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold mt-0.5 animate-bounce">
                      <Crosshair className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block leading-tight">
                        Stamp Location Required Before Approval
                      </span>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-tight">
                        You must place your stamp directly onto the signature line of the document before finalizing approval.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPlacerModalOpen(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#0F2962] hover:bg-[#091a42] text-amber-300 font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer ring-2 ring-blue-500/20"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>Set Stamp Location on Document</span>
                  </button>
                </div>
              )}

              {/* Row 3: Electronic Signature Checkbox Toggle */}
              <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                signatureApplied ? "bg-emerald-50/60 border-emerald-300 text-emerald-950" : "bg-white border-slate-200 text-slate-700"
              }`}>
                <input
                  type="checkbox"
                  checked={signatureApplied}
                  onChange={(e) => setSignatureApplied(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#0F2962] focus:ring-[#0F2962] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-black block leading-tight">
                    Stamp Electronic Signature on Document
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                    Embeds official verification seal at selected coordinates and signs cryptographic audit trail
                  </span>
                </div>
              </label>
            </div>

            {/* Action Command Deck */}
            <div className="space-y-2.5 pt-1">
              {/* Hero Approve Action Button */}
              <button
                onClick={handleApprove}
                disabled={isLoading}
                className={`w-full py-3.5 px-6 rounded-2xl text-white text-xs font-black shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-98 cursor-pointer disabled:opacity-50 ${
                  customCoordinates
                    ? "bg-linear-to-r from-emerald-600 via-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-emerald-950/20 hover:shadow-xl"
                    : "bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] shadow-blue-950/20 ring-2 ring-blue-400/30"
                }`}
              >
                {customCoordinates ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-200" />
                    <span>Approve & Stamp E-Signature</span>
                  </>
                ) : (
                  <>
                    <Crosshair className="w-4 h-4 text-amber-300" />
                    <span>Set Location & Approve Document</span>
                  </>
                )}
              </button>

              {/* Secondary Actions (Return for Revision / Reject) */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleRejectReturn}
                  disabled={isLoading}
                  className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 hover:-translate-y-0.5 active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Return for Revision</span>
                </button>

                <button
                  onClick={handleRejectClose}
                  disabled={isLoading}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 hover:border-rose-300 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Cancel / Reject</span>
                </button>
              </div>
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

      {/* Return for Revision Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="glass-panel rounded-3xl p-6 sm:p-7 max-w-lg w-full bg-white shadow-2xl space-y-5 border border-amber-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-xs font-bold mt-0.5">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Return Document for Revision</h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    The document will be returned to the uploader. An immutable version tree will record your remarks and request a revised version (v2+).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Mandatory Revision Remarks & Feedback *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Explain the required revisions, corrections, or adjustments for the uploader..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="block w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-inner placeholder:text-slate-400"
                autoFocus
              />
              <p className="text-[11px] text-slate-500 font-medium">
                The uploader will receive these remarks directly in their notifications and document dashboard.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReturn}
                disabled={isLoading || !comments.trim()}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isLoading ? "Returning..." : "Confirm Return for Revision"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminally Close & Reject Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="glass-panel rounded-3xl p-6 sm:p-7 max-w-lg w-full bg-white shadow-2xl space-y-5 border border-red-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 shadow-xs font-bold mt-0.5">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Terminally Close & Reject</h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    This action is <strong>irreversible</strong>. The document will be permanently marked as rejected and removed from active signatory pipelines.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCloseConfirm(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Mandatory Reason for Cancellation *
              </label>
              <textarea
                rows={4}
                required
                placeholder="State the institutional reason for permanently closing and rejecting this document..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="block w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-inner placeholder:text-slate-400"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCloseConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Keep Active / Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmedClose}
                disabled={isLoading || !comments.trim()}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{isLoading ? "Rejecting..." : "Confirm Terminal Rejection"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
