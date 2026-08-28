import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, AuthenticatedUser } from "@/lib/auth/session";
import DocumentDetailActions from "@/components/DocumentDetailActions";
import LiveDocumentViewer from "@/components/LiveDocumentViewer";
import CopyTrackingButton from "@/components/CopyTrackingButton";
import Breadcrumbs from "@/components/Breadcrumbs";
import DocumentVersionDiffTrigger from "@/components/DocumentVersionDiffTrigger";
import DocumentTimelineView from "@/components/DocumentTimelineView";
import {
  getStatusLabel,
  getStatusBadgeClass,
  getRoleLabel,
  getActionLabel,
  formatFileSize,
  formatHumanDate,
  formatHumanDateTime,
} from "@/lib/status-labels";
import {
  GitBranch,
  ShieldCheck,
  ArrowLeft,
  PenLine,
  Lock,
  Shield,
  Fingerprint,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { DocumentStatus, ApprovalActionType, UserRole, UserStatus } from "@prisma/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface VersionDetail {
  id: string;
  versionNumber: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  sha256Checksum: string;
  storagePath: string;
  changeSummary: string | null;
  createdAt: Date;
  uploadedBy?: { firstName: string; lastName: string } | null;
}

interface ApprovalActionDetail {
  id: string;
  action: ApprovalActionType;
  actorRole: UserRole;
  comments: string | null;
  signatureApplied: boolean;
  createdAt: Date;
  actor: { firstName: string; lastName: string; email: string };
  version?: { versionNumber: number } | null;
}

interface DocumentDetail {
  id: string;
  trackingNumber: string;
  title: string;
  description: string | null;
  status: DocumentStatus;
  approvalLevel: string;
  rejectionCount: number;
  isEscalated: boolean;
  effectiveDate: Date | null;
  expiryDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  uploaderId: string;
  unitId: string;
  signatoryFlow?: unknown;
  currentSignatoryId?: string | null;
  currentSignatoryIndex?: number;
  currentSignatory?: { id: string; firstName: string; lastName: string; role: string; email: string } | null;
  unit: { code: string; name: string } | null;
  uploader: { firstName: string; lastName: string; email: string };
  documentType: {
    code: string;
    name: string;
    defaultApprovalLevel: string;
    defaultRetentionDays: number;
  } | null;
  currentVersion: VersionDetail | null;
  versions: VersionDetail[];
  approvalActions: ApprovalActionDetail[];
}

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const currentUser: AuthenticatedUser = (await getAuthenticatedUser()) || {
    id: "demo-coordinator-user",
    email: "coordinator.career@firstasia.edu.ph",
    firstName: "Maria",
    lastName: "Santos",
    fullName: "Maria Santos",
    employeeId: "EMP-COORD-001",
    role: UserRole.COORDINATOR,
    status: UserStatus.ACTIVE,
    unitId: "demo-unit-career",
    unitCode: "CAREER",
    unitName: "Career Services & Placement",
    signaturePath: null,
  };

  let doc: DocumentDetail | null = null;
  let isAccessDenied = false;

  try {
    const fetchedDoc = await prisma.document.findUnique({
      where: { id },
      include: {
        documentType: true,
        unit: true,
        uploader: true,
        currentSignatory: true,
        currentVersion: true,
        versions: {
          orderBy: { versionNumber: "desc" },
          include: { uploadedBy: true },
        },
        approvalActions: {
          orderBy: { createdAt: "asc" },
          include: { actor: true, version: true },
        },
      },
    });

    if (fetchedDoc) {
      // Strict Cross-Unit Tenancy Enforcement (IDOR Protection)
      const flow = Array.isArray(fetchedDoc.signatoryFlow)
        ? (fetchedDoc.signatoryFlow as Array<{ userId: string }>)
        : [];
      const isInFlow = flow.some((s) => s.userId === currentUser.id);
      const isAuthorized =
        currentUser.role === "ADMIN" ||
        currentUser.role === "DIRECTOR" ||
        fetchedDoc.unitId === currentUser.unitId ||
        fetchedDoc.uploaderId === currentUser.id ||
        fetchedDoc.currentSignatoryId === currentUser.id ||
        isInFlow;

      if (!isAuthorized) {
        isAccessDenied = true;
      } else {
        doc = fetchedDoc as unknown as DocumentDetail;
      }
    }
  } catch {
    doc = null;
  }

  if (isAccessDenied) {
    return (
      <div className="p-6 lg:p-12 max-w-2xl mx-auto w-full text-center space-y-6 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Access Restricted • Unit Boundary Isolation</h1>
          <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
            Under SAS Institutional Data Governance and RA 10173 policy, documents belonging to other departmental units are partitioned. You do not have authorization to view this record.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/dashboard/documents"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F2962] text-white text-xs font-bold shadow-md hover:bg-[#1E40AF] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to My Unit Repository</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="p-6 lg:p-12 max-w-2xl mx-auto w-full text-center space-y-6 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto shadow-inner">
          <Shield className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Document Not Found</h1>
          <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
            The requested document record does not exist or has been removed from the repository.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/dashboard/documents"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F2962] text-white text-xs font-bold shadow-md hover:bg-[#1E40AF] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Repository</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full">
      {/* Breadcrumbs Navigation */}
      <div>
        <Breadcrumbs
          items={[
            { label: "Document Repository", href: "/dashboard/documents" },
            { label: doc.trackingNumber },
          ]}
        />
      </div>

      {/* Header Banner & Live Pipeline Progress Stepper */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <CopyTrackingButton trackingNumber={doc.trackingNumber} />
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(
                  doc.status
                )}`}
              >
                {getStatusLabel(doc.status)}
              </span>
              {doc.isEscalated && (
                <span className="badge-escalated px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  Auto-Escalated (Rejections: {doc.rejectionCount})
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {doc.title}
            </h1>
          </div>
        </div>

        {/* 📊 Visual Sequential Turn Progress Bar */}
        {(() => {
          const flowList = Array.isArray(doc.signatoryFlow)
            ? (doc.signatoryFlow as Array<{ fullName?: string; title?: string; role?: string; status?: string }>)
            : [];
          const totalSteps = flowList.length > 0 ? flowList.length : 1;
          const currentStep = (doc.currentSignatoryIndex ?? 0) + 1;
          const isApproved = doc.status === "APPROVED" || doc.status === "ARCHIVED";
          const isReturned = doc.status === "REJECTED_RETURNED";
          const progressPercent = isApproved
            ? 100
            : isReturned
            ? 25
            : Math.max(15, Math.min(95, Math.round(((currentStep - 0.5) / totalSteps) * 100)));

          return (
            <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold uppercase tracking-wider text-slate-600">
                  Sequential Review Pipeline Progress
                </span>
                <span className="font-mono font-bold text-[#0F2962]">
                  {isApproved
                    ? "100% • Sealed & Completed"
                    : isReturned
                    ? "Returned for Revision"
                    : flowList.length > 0
                    ? `Step ${currentStep} of ${flowList.length} • Awaiting ${flowList[doc.currentSignatoryIndex ?? 0]?.fullName || "Signatory"}`
                    : "In Review"}
                </span>
              </div>

              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-500 shadow-sm ${
                    isApproved
                      ? "bg-linear-to-r from-emerald-500 to-teal-400"
                      : isReturned
                      ? "bg-linear-to-r from-amber-500 to-orange-400"
                      : "bg-linear-to-r from-[#0F2962] via-blue-600 to-amber-400"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {flowList.length > 0 ? (
                <div className="flex items-center justify-between gap-2 pt-1 text-[11px] overflow-x-auto">
                  <div className="text-left font-bold text-emerald-800 shrink-0">
                    <span>✓ Ingested</span>
                  </div>
                  {flowList.map((step, idx) => {
                    const isDone = step.status === "APPROVED" || isApproved;
                    const isCurrent = !isApproved && (doc.currentSignatoryIndex ?? 0) === idx;
                    return (
                      <div
                        key={idx}
                        className={`text-center font-bold truncate max-w-32 shrink-0 ${
                          isDone ? "text-emerald-700" : isCurrent ? "text-[#0F2962] font-black" : "text-slate-400"
                        }`}
                        title={step.fullName}
                      >
                        <span>{idx + 1}. {step.fullName || `Signer ${idx + 1}`}</span>
                      </div>
                    );
                  })}
                  <div className={`text-right font-bold shrink-0 ${isApproved ? "text-emerald-800" : "text-slate-400"}`}>
                    <span>Sealed Vault</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="text-left font-bold text-emerald-800">
                    <span>✓ Ingested</span>
                  </div>
                  <div className={`text-right font-bold ${isApproved ? "text-emerald-800" : "text-slate-400"}`}>
                    <span>{isApproved ? "✓ Sealed Vault" : "Pending Signatory"}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ⚠️ Prominent Originator Callout: Revision Feedback or Rejection Reason Banner */}
      {(() => {
        const latestRejectionAction = doc.approvalActions
          .filter((a) => a.action === "REJECT_RETURN" || a.action === "REJECT_CLOSE")
          .slice(-1)[0];

        if (doc.status === DocumentStatus.REJECTED_RETURNED) {
          return (
            <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-br from-amber-500/15 via-orange-500/10 to-amber-50 border-2 border-amber-400 shadow-md space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-amber-950 uppercase tracking-wide">
                        Action Required: Document Returned for Revision
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black border border-amber-300">
                        Revision Cycle #{doc.rejectionCount || 1}
                      </span>
                    </div>
                    {latestRejectionAction && (
                      <p className="text-xs text-amber-800 font-medium mt-0.5">
                        Returned by <span className="font-bold">{latestRejectionAction.actor.firstName} {latestRejectionAction.actor.lastName}</span> ({getRoleLabel(latestRejectionAction.actorRole)}) on {formatHumanDateTime(latestRejectionAction.createdAt)}
                      </p>
                    )}
                  </div>
                </div>
                {doc.isEscalated && (
                  <span className="px-3 py-1 rounded-xl bg-red-100 text-red-800 text-xs font-black border border-red-200 flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                    ⚠️ Flagged for Director Mediation
                  </span>
                )}
              </div>

              {/* The Mandatory Remarks Quote Box */}
              <div className="p-4 rounded-2xl bg-white/95 border border-amber-300/80 shadow-xs space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-900">
                  <PenLine className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reviewer Feedback &amp; Required Rework Instructions</span>
                </div>
                <p className="text-sm text-slate-900 font-medium leading-relaxed italic bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
                  &ldquo;{latestRejectionAction?.comments || "Please address reviewer feedback and upload a revised version."}&rdquo;
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 font-medium pt-1">
                <p className="leading-tight">
                  💡 <strong>Next Step for Originator:</strong> Upload a revised PDF document (v2+) addressing the reviewer feedback above in the Workflow Actions panel on the right.
                </p>
              </div>
            </div>
          );
        }

        if (doc.status === DocumentStatus.REJECTED_CLOSED) {
          return (
            <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-br from-rose-500/15 via-red-500/10 to-rose-50 border-2 border-rose-400 shadow-md space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 pb-3 border-b border-rose-200/80">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-rose-950 uppercase tracking-wide">
                      Document Terminated &amp; Closed
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 text-[10px] font-black border border-rose-300">
                      Terminal Rejection
                    </span>
                  </div>
                  {latestRejectionAction && (
                    <p className="text-xs text-rose-800 font-medium mt-0.5">
                      Terminally rejected by <span className="font-bold">{latestRejectionAction.actor.firstName} {latestRejectionAction.actor.lastName}</span> ({getRoleLabel(latestRejectionAction.actorRole)}) on {formatHumanDateTime(latestRejectionAction.createdAt)}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/95 border border-rose-300/80 shadow-xs space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-rose-900">
                  <span>Stated Reason for Cancellation</span>
                </div>
                <p className="text-sm text-slate-900 font-medium leading-relaxed italic bg-rose-50/70 p-3.5 rounded-xl border border-rose-200">
                  &ldquo;{latestRejectionAction?.comments || "Document workflow was permanently closed by reviewer."}&rdquo;
                </p>
              </div>
            </div>
          );
        }

        return null;
      })()}

      {/* Grid: Details & Actions */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Live Document Preview, Metadata & History */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Document Viewer & Stream */}
          {doc.currentVersion && (
            <LiveDocumentViewer
              documentId={doc.id}
              documentTitle={doc.title}
              trackingNumber={doc.trackingNumber}
              storagePath={doc.currentVersion.storagePath}
              fileName={doc.currentVersion.fileName}
              fileSize={doc.currentVersion.fileSize}
              mimeType={doc.currentVersion.mimeType}
              versionNumber={doc.currentVersion.versionNumber}
            />
          )}

          {/* Metadata Card */}
          <div className="glass-card rounded-2xl p-6 border border-slate-200 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Document Specifications
            </h2>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Classification Type</span>
                <span className="font-semibold text-slate-900">
                  {doc.documentType?.name || "General"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Department Unit</span>
                <span className="font-semibold text-slate-900">
                  {doc.unit?.name} ({doc.unit?.code})
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Submitted By</span>
                <span className="font-semibold text-slate-900">
                  {doc.uploader.firstName} {doc.uploader.lastName}
                </span>
                <span className="text-[11px] text-slate-400 block">{doc.uploader.email}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Assigned Signatory Chain</span>
                <span className="font-semibold text-[#0F2962]">
                  {Array.isArray(doc.signatoryFlow) &&
                  (doc.signatoryFlow as Array<{ fullName?: string; title?: string; role?: string }>).length > 0
                    ? (doc.signatoryFlow as Array<{ fullName?: string; title?: string; role?: string }>)
                        .map((s) => s.fullName || s.title || s.role)
                        .join(" → ")
                    : "Assigned Signatories"}
                </span>
              </div>

              {doc.effectiveDate && (
                <div>
                  <span className="text-slate-400 block mb-0.5">Effective Date</span>
                  <span className="font-semibold text-slate-900">
                    {formatHumanDate(doc.effectiveDate)}
                  </span>
                </div>
              )}

              {doc.expiryDate && (
                <div>
                  <span className="text-slate-400 block mb-0.5">Expiry / Renewal Date</span>
                  <span className="font-semibold text-amber-800">
                    {formatHumanDate(doc.expiryDate)}
                  </span>
                </div>
              )}
            </div>

            {doc.description && (
              <div className="pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-400 block mb-1">Context & Description</span>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                  {doc.description}
                </p>
              </div>
            )}
          </div>

          {/* Institutional Cryptographic Integrity & RA 10173 Compliance Box */}
          <div className="glass-panel border-gradient-gold rounded-2xl p-6 border border-white/90 space-y-4 shadow-sm bg-linear-to-br from-white via-slate-50/50 to-amber-50/20">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Fingerprint className="w-4.5 h-4.5 text-[#0F2962]" />
                <span>Cryptographic Proof of Integrity & Privacy (RA 10173)</span>
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Verified Authentic</span>
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>Active Version SHA-256 Checksum</span>
                  </span>
                  <span className="text-amber-400">Zero Overwrite</span>
                </div>
                <span className="text-amber-300 font-black break-all block selection:bg-amber-400 selection:text-slate-900">
                  {doc.currentVersion?.sha256Checksum || "SHA256_UNSET_PRE_MIGRATION"}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-slate-600">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-blue-700 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block text-[11px]">Audit Logging</span>
                    <span className="text-[10px] text-slate-500 block">Immutable event chain stamped</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block text-[11px]">RA 10173 Protection</span>
                    <span className="text-[10px] text-slate-500 block">Restricted institutional access</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Version History Drawer */}
          <div className="glass-card rounded-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-blue-600" />
                <span>Immutable Version History (Zero Overwrite)</span>
              </h2>
              <div className="flex items-center gap-2.5">
                <DocumentVersionDiffTrigger
                  versions={doc.versions}
                  trackingNumber={doc.trackingNumber}
                />
                <span className="text-xs text-slate-400 font-medium font-mono">
                  {doc.versions.length} Version(s)
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {doc.versions.map((ver) => (
                <div
                  key={ver.id}
                  className={`p-3.5 rounded-xl border transition ${
                    ver.id === doc?.currentVersion?.id
                      ? "border-blue-300 bg-blue-50/50"
                      : "border-slate-200 bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-bold text-xs">
                        v{ver.versionNumber}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {ver.fileName}
                      </span>
                      {ver.id === doc?.currentVersion?.id && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono font-medium">
                      {formatFileSize(ver.fileSize)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 italic bg-white/80 p-2 rounded border border-slate-200/60">
                    &ldquo;{ver.changeSummary || "No change log provided"}&rdquo;
                  </p>

                  <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>
                      Uploaded by {ver.uploadedBy?.firstName} {ver.uploadedBy?.lastName} on{" "}
                      {formatHumanDateTime(ver.createdAt)}
                    </span>
                    <span className="font-mono text-slate-500">
                      SHA: {ver.sha256Checksum.substring(0, 12)}...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Lifecycle Timeline */}
          <DocumentTimelineView
            status={doc.status}
            createdAt={doc.createdAt}
            uploader={doc.uploader}
            approvalActions={doc.approvalActions}
            isEscalated={doc.isEscalated}
          />

          {/* Sequential Approval Timeline */}
          <div className="glass-card rounded-2xl p-6 border border-slate-200 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Sequential Approval & Audit Timeline</span>
            </h2>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
              {doc.approvalActions.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No review actions recorded yet.</p>
              ) : (
                doc.approvalActions.map((action) => (
                  <div key={action.id} className="relative flex items-start gap-4 text-xs">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-sm z-10 ${
                        action.action === ApprovalActionType.SUBMIT
                          ? "bg-blue-600"
                          : action.action === ApprovalActionType.COORDINATOR_APPROVE
                          ? "bg-emerald-600"
                          : action.action === ApprovalActionType.DIRECTOR_APPROVE
                          ? "bg-[#0F2962]"
                          : action.action === ApprovalActionType.REJECT_RETURN
                          ? "bg-amber-600"
                          : "bg-red-600"
                      }`}
                    >
                      ✓
                    </div>

                    <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {getActionLabel(action.action)} by {action.actor.firstName}{" "}
                          {action.actor.lastName} ({getRoleLabel(action.actorRole)})
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatHumanDateTime(action.createdAt)}
                        </span>
                      </div>

                      {action.comments && (
                        <p className="text-xs text-slate-700 bg-white p-2 rounded border border-slate-200/80 mt-1">
                          {action.comments}
                        </p>
                      )}

                      {action.signatureApplied && (
                        <div className="mt-2.5 p-3 rounded-xl bg-linear-to-r from-blue-50/80 via-indigo-50/50 to-emerald-50/70 border border-blue-200/90 text-[11px] space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-black text-[#0F2962]">
                              <PenLine className="w-3.5 h-3.5 text-[#0F2962]" />
                              <span>FAITH COLLEGES • SAS VERIFIED STAMP</span>
                            </div>
                            <span className="font-mono text-[9px] font-black text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full">
                              ✓ AUTHENTICATED
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-600 font-mono pt-0.5">
                            <span>Signer: <strong>{action.actor.firstName} {action.actor.lastName}</strong></span>
                            <span>Direct In-Document Alpha Blend</span>
                          </div>
                          <div className="text-[9px] font-mono text-slate-500 truncate block">
                            Security Token: ID: SAS-{action.id.substring(0, 14).toUpperCase()} • PST Certified
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Actions */}
        <div className="lg:col-span-5">
          <div className="sticky top-20">
            <DocumentDetailActions
              document={{
                id: doc.id,
                trackingNumber: doc.trackingNumber,
                status: doc.status,
                uploaderId: doc.uploaderId,
                unitId: doc.unitId,
                isEscalated: doc.isEscalated,
                rejectionCount: doc.rejectionCount,
                currentVersion: doc.currentVersion,
                signatoryFlow: doc.signatoryFlow,
                currentSignatoryId: doc.currentSignatoryId,
                currentSignatoryIndex: doc.currentSignatoryIndex,
                currentSignatory: doc.currentSignatory,
              }}
              currentUser={currentUser}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
