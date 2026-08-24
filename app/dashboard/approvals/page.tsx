import Link from "next/link";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getStatusLabel, getStatusBadgeClass } from "@/lib/status-labels";
import {
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  User,
  Building2,
  Calendar,
  PenLine,
  ShieldAlert,
  Sparkles,
  GitBranch,
} from "lucide-react";
import { DocumentStatus } from "@prisma/client";

interface ApprovalQueueItem {
  id: string;
  trackingNumber: string;
  title: string;
  status: DocumentStatus;
  isEscalated: boolean;
  rejectionCount: number;
  createdAt: Date;
  currentSignatoryIndex: number;
  signatoryFlow?: unknown;
  unit: { name: string; code: string } | null;
  uploader: { firstName: string; lastName: string };
  documentType: { name: string } | null;
  currentVersion: { versionNumber: number; fileName: string } | null;
}

export const dynamic = "force-dynamic";

export default async function ApprovalQueuePage() {
  // Auth enforced by dashboard layout
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const isDirectorOrAdmin = user.role === "DIRECTOR" || user.role === "ADMIN";

  let pendingDocs: ApprovalQueueItem[] = [];

  if (isDatabaseConfigured) {
    try {
      if (isDirectorOrAdmin) {
        // Director reviews all PENDING_DIRECTOR plus any escalated documents or specifically assigned to them
        const docs = await prisma.document.findMany({
          where: {
            OR: [
              { status: DocumentStatus.PENDING_DIRECTOR },
              { isEscalated: true },
              { currentSignatoryId: user.id },
            ],
          },
          include: {
            documentType: true,
            unit: true,
            uploader: true,
            currentVersion: true,
          },
          orderBy: { updatedAt: "desc" },
        });
        pendingDocs = docs as unknown as ApprovalQueueItem[];
      } else {
        // Coordinator or assigned user reviews items assigned to them or pending in their unit
        const docs = await prisma.document.findMany({
          where: {
            OR: [
              { currentSignatoryId: user.id },
              {
                unitId: user.unitId || undefined,
                status: DocumentStatus.PENDING_COORDINATOR,
              },
            ],
          },
          include: {
            documentType: true,
            unit: true,
            uploader: true,
            currentVersion: true,
          },
          orderBy: { updatedAt: "desc" },
        });
        pendingDocs = docs as unknown as ApprovalQueueItem[];
      }
    } catch {
      pendingDocs = [];
    }
  }

  if (pendingDocs.length === 0) {
    pendingDocs = [
      {
        id: "sample-doc-1",
        trackingNumber: "SAS-2026-CAR-00001",
        title: "AY 2026-2027 Industry Internship Partner MOU",
        status: DocumentStatus.PENDING_COORDINATOR,
        isEscalated: false,
        rejectionCount: 0,
        createdAt: new Date(),
        currentSignatoryIndex: 0,
        signatoryFlow: null,
        unit: { name: "Career Services & Placement", code: "CAREER" },
        uploader: { firstName: "Juan", lastName: "Dela Cruz" },
        documentType: { name: "Memorandum of Agreement / Understanding" },
        currentVersion: { versionNumber: 1, fileName: "Industry_MOU_Draft.pdf" },
      },
    ];
  }

  const escalatedCount = pendingDocs.filter((d) => d.isEscalated).length;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sequential Approval Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold font-mono">
              {pendingDocs.length} Pending
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isDirectorOrAdmin
              ? "Final Executive Director Approvals & Auto-Escalated Unit Reviews"
              : `Level-1 Unit Coordinator Reviews for ${user.unitName || "Unit"}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-blue-50/80 border border-blue-200 text-[11px] font-bold text-[#0F2962] flex items-center gap-1.5">
            <PenLine className="w-3.5 h-3.5 text-blue-700" />
            <span>Smart Anchor E-Sign Enabled</span>
          </div>
        </div>
      </div>

      {/* Escalation Highlights */}
      {escalatedCount > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-900 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse shrink-0" />
          <span className="text-xs font-bold">
            {escalatedCount} document(s) in this queue have exceeded standard rework limits and require executive attention.
          </span>
        </div>
      )}

      {/* Main Review Deck */}
      {pendingDocs.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 border border-slate-200 text-center space-y-3 bg-white">
          <CheckSquare className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">All Caught Up!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are no documents currently awaiting your review or sign-off.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingDocs.map((doc) => (
            <div
              key={doc.id}
              className={`glass-card rounded-2xl p-6 border transition hover:shadow-md bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                doc.isEscalated ? "border-red-300 bg-red-50/20" : "border-slate-200"
              }`}
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#0F2962] bg-blue-50 px-2 py-0.5 rounded">
                    {doc.trackingNumber}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(doc.status)}`}>
                    {getStatusLabel(doc.status)}
                  </span>
                  {(() => {
                    const flow = Array.isArray(doc.signatoryFlow) ? doc.signatoryFlow : [];
                    if (flow.length > 0) {
                      return (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                          <GitBranch className="w-3 h-3" />
                          Step {doc.currentSignatoryIndex + 1} of {flow.length}
                        </span>
                      );
                    }
                    return null;
                  })()}
                  {doc.isEscalated && (
                    <span className="badge-escalated px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Auto-Escalated (Rejections: {doc.rejectionCount})</span>
                    </span>
                  )}
                  {doc.currentVersion && (
                    <span className="text-[10px] font-bold font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      v{doc.currentVersion.versionNumber}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{doc.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{doc.documentType?.name || "General Document"}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{doc.unit?.name || "General"}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{doc.uploader.firstName} {doc.uploader.lastName}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>

              {/* Action Side */}
              <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
                <Link
                  href={`/dashboard/documents/${doc.id}`}
                  className="px-5 py-2.5 rounded-xl bg-[#0F2962] hover:bg-[#091a42] text-white text-xs font-bold shadow-sm transition flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Review & E-Sign</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
