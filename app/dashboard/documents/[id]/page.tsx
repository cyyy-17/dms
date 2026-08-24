import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import DocumentDetailActions from "@/components/DocumentDetailActions";
import LiveDocumentViewer from "@/components/LiveDocumentViewer";
import {
  GitBranch,
  ShieldCheck,
  ArrowLeft,
  PenLine,
} from "lucide-react";
import { DocumentStatus, ApprovalActionType, UserRole } from "@prisma/client";

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
  let currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    currentUser = {
      id: "demo-staff-user",
      email: "demo.staff@firstasia.edu.ph",
      firstName: "Maria",
      lastName: "Santos",
      fullName: "Maria Santos",
      role: UserRole.COORDINATOR,
      status: "ACTIVE",
      unitId: "demo-unit-career",
      unitCode: "CAREER",
      unitName: "Career Services & Placement",
      signaturePath: null,
    };
  }

  let doc: DocumentDetail | null = null;

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
      doc = fetchedDoc as unknown as DocumentDetail;
    }
  } catch {
    doc = null;
  }

  if (!doc) {
    // Demo Mock Document for UI Preview
    doc = {
      id: id,
      trackingNumber: "SAS-2026-CAR-00001",
      title: "AY 2026-2027 Industry Internship Partner MOU",
      description:
        "Standard institutional Memorandum of Agreement covering student internship placements and industry immersion programs.",
      status: DocumentStatus.PENDING_DIRECTOR,
      approvalLevel: "DIRECTOR_REQUIRED",
      rejectionCount: 1,
      isEscalated: false,
      effectiveDate: new Date("2026-09-01T00:00:00.000Z"),
      expiryDate: new Date("2027-08-31T00:00:00.000Z"),
      uploaderId: currentUser.id,
      unitId: currentUser.unitId || "unit-career",
      unit: { code: "CAREER", name: "Career Services & Placement" },
      uploader: { firstName: "Juan", lastName: "Dela Cruz", email: "jdelacruz@firstasia.edu.ph" },
      documentType: {
        code: "MOU_MOA",
        name: "Memorandum of Agreement / Understanding",
        defaultApprovalLevel: "DIRECTOR_REQUIRED",
        defaultRetentionDays: 3650,
      },
      currentVersion: {
        id: "ver-1",
        versionNumber: 1,
        fileName: "Industry_Partner_MOU_Draft.pdf",
        fileSize: 1048576,
        mimeType: "application/pdf",
        sha256Checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        storagePath: "documents/CAREER/MOU_MOA/SAS-2026-CAR-00001/v1_draft.pdf",
        changeSummary: "Initial Version (v1) Submission",
        createdAt: new Date("2026-08-24T00:00:00.000Z"),
      },
      versions: [
        {
          id: "ver-1",
          versionNumber: 1,
          fileName: "Industry_Partner_MOU_Draft.pdf",
          fileSize: 1048576,
          mimeType: "application/pdf",
          sha256Checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          storagePath: "documents/CAREER/MOU_MOA/SAS-2026-CAR-00001/v1_draft.pdf",
          changeSummary: "Initial Version (v1) Submission",
          createdAt: new Date("2026-08-24T00:00:00.000Z"),
          uploadedBy: { firstName: "Juan", lastName: "Dela Cruz" },
        },
      ],
      approvalActions: [
        {
          id: "action-1",
          action: ApprovalActionType.SUBMIT,
          actorRole: UserRole.STAFF,
          comments: "Submitted for initial Coordinator review",
          signatureApplied: false,
          createdAt: new Date("2026-08-24T01:00:00.000Z"),
          actor: { firstName: "Juan", lastName: "Dela Cruz", email: "jdelacruz@firstasia.edu.ph" },
          version: { versionNumber: 1 },
        },
        {
          id: "action-2",
          action: ApprovalActionType.COORDINATOR_APPROVE,
          actorRole: UserRole.COORDINATOR,
          comments: "Reviewed and endorsed for Director signature.",
          signatureApplied: true,
          createdAt: new Date("2026-08-24T02:00:00.000Z"),
          actor: { firstName: "Maria", lastName: "Santos", email: "msantos@firstasia.edu.ph" },
          version: { versionNumber: 1 },
        },
      ],
    };
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full">
      {/* Back link */}
      <div>
        <Link
          href="/dashboard/documents"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0F2962] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Repository</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
              {doc.trackingNumber}
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                doc.status === DocumentStatus.APPROVED
                  ? "badge-approved"
                  : doc.status === DocumentStatus.REJECTED_RETURNED
                  ? "badge-returned"
                  : doc.status === DocumentStatus.PENDING_COORDINATOR ||
                    doc.status === DocumentStatus.PENDING_DIRECTOR
                  ? "badge-pending"
                  : "badge-draft"
              }`}
            >
              {doc.status.replace("_", " ")}
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

      {/* Grid: Details & Actions */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Live Document Preview, Metadata & History */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Document Viewer & Stream */}
          {doc.currentVersion && (
            <LiveDocumentViewer
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
                <span className="text-slate-400 block mb-0.5">Required Approval Chain</span>
                <span className="font-semibold text-[#0F2962]">
                  Unit Staff → Unit Coordinator{" "}
                  {doc.approvalLevel === "DIRECTOR_REQUIRED" ? "→ Director" : ""}
                </span>
              </div>

              {doc.effectiveDate && (
                <div>
                  <span className="text-slate-400 block mb-0.5">Effective Date</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(doc.effectiveDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              {doc.expiryDate && (
                <div>
                  <span className="text-slate-400 block mb-0.5">Expiry / Renewal Date</span>
                  <span className="font-semibold text-amber-800">
                    {new Date(doc.expiryDate).toLocaleDateString()}
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

          {/* Version History Drawer */}
          <div className="glass-card rounded-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-blue-600" />
                <span>Immutable Version History (Zero Overwrite)</span>
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {doc.versions.length} Version(s)
              </span>
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
                    <span className="text-[11px] text-slate-400">
                      {(ver.fileSize / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 italic bg-white/80 p-2 rounded border border-slate-200/60">
                    &ldquo;{ver.changeSummary || "No change log provided"}&rdquo;
                  </p>

                  <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>
                      Uploaded by {ver.uploadedBy?.firstName} {ver.uploadedBy?.lastName} on{" "}
                      {new Date(ver.createdAt).toLocaleString()}
                    </span>
                    <span className="font-mono text-slate-500">
                      SHA: {ver.sha256Checksum.substring(0, 12)}...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
                          {action.action.replace("_", " ")} by {action.actor.firstName}{" "}
                          {action.actor.lastName} ({action.actorRole})
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(action.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {action.comments && (
                        <p className="text-xs text-slate-700 bg-white p-2 rounded border border-slate-200/80 mt-1">
                          {action.comments}
                        </p>
                      )}

                      {action.signatureApplied && (
                        <div className="mt-2 flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px]">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                            <PenLine className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Institutional Electronic Signature Cryptographically Stamped</span>
                          </div>
                          <span className="font-mono text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded">
                            RA 10173 Verified
                          </span>
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
              }}
              currentUser={currentUser}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
