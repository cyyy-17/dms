import Link from "next/link";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getStatusLabel, getStatusBadgeClass, formatHumanDate } from "@/lib/status-labels";
import CopyTrackingButton from "@/components/CopyTrackingButton";
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
  FilePlus2,
  FileText,
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

  const escalatedCount = pendingDocs.filter((d) => d.isEscalated).length;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Sequential Approval Queue
            </h1>
            <span className="px-3 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black font-mono shadow-xs">
              {pendingDocs.length} Pending Turn{pendingDocs.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {isDirectorOrAdmin
              ? "Final Executive Director Approvals & Auto-Escalated Unit Reviews"
              : `Level-1 Unit Coordinator Reviews for ${user.unitName || "Assigned Unit"}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-blue-50/90 border border-blue-200 text-xs font-bold text-[#0F2962] flex items-center gap-2 shadow-xs">
            <PenLine className="w-4 h-4 text-blue-700" />
            <span>Smart Anchor E-Sign Ready</span>
          </div>
        </div>
      </div>

      {/* Escalation Highlights */}
      {escalatedCount > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-50 border border-rose-200 flex items-center gap-3.5 text-rose-950 shadow-sm">
          <ShieldAlert className="w-6 h-6 text-rose-600 animate-pulse shrink-0" />
          <div className="text-xs font-medium">
            <strong className="font-bold text-rose-900 block sm:inline">
              {escalatedCount} document{escalatedCount === 1 ? "" : "s"} in this queue have exceeded standard rework limits.
            </strong>{" "}
            Immediate executive review is requested.
          </div>
        </div>
      )}

      {/* Main Review Deck */}
      {pendingDocs.length === 0 ? (
        <div className="glass-panel rounded-3xl p-14 border border-white/90 text-center space-y-4 shadow-sm bg-white/80">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckSquare className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900">Your Approval Queue is Empty!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
              There are no documents currently waiting for your review or electronic signature.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href="/dashboard/documents/new"
              className="px-4.5 py-2.5 rounded-xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2"
            >
              <FilePlus2 className="w-4 h-4 text-amber-400" />
              <span>Ingest New Document</span>
            </Link>
            <Link
              href="/dashboard/documents"
              className="px-4.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Browse All Records</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingDocs.map((doc) => (
            <div
              key={doc.id}
              className={`glass-panel glass-panel-interactive rounded-3xl p-6 sm:p-7 border transition duration-200 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                doc.isEscalated ? "border-rose-300 bg-rose-50/30" : "border-white/90"
              }`}
            >
              <div className="space-y-3.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <CopyTrackingButton trackingNumber={doc.trackingNumber} />
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(doc.status)}`}>
                    {getStatusLabel(doc.status)}
                  </span>
                  {(() => {
                    const flow = Array.isArray(doc.signatoryFlow) ? doc.signatoryFlow : [];
                    if (flow.length > 0) {
                      return (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full shadow-xs">
                          <GitBranch className="w-3 h-3" />
                          Signatory Step {doc.currentSignatoryIndex + 1} of {flow.length}
                        </span>
                      );
                    }
                    return null;
                  })()}
                  {doc.isEscalated && (
                    <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-xs">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      <span>Auto-Escalated (Rejections: {doc.rejectionCount})</span>
                    </span>
                  )}
                  {doc.currentVersion && (
                    <span className="text-[10px] font-bold font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                      v{doc.currentVersion.versionNumber}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{doc.title}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{doc.documentType?.name || "General Document"}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{doc.unit?.name || "General Unit"}</strong>
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{doc.uploader.firstName} {doc.uploader.lastName}</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatHumanDate(doc.createdAt)}</span>
                  </span>
                </div>
              </div>

              {/* Action Side */}
              <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
                <Link
                  href={`/dashboard/documents/${doc.id}`}
                  className="px-5 py-3 rounded-2xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white text-xs font-bold shadow-lg shadow-blue-950/20 hover:shadow-xl transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5 active:scale-98"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Review & Sign Document</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
