import Link from "next/link";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getStatusLabel, getStatusBadgeClass, getRoleLabel } from "@/lib/status-labels";
import CopyTrackingButton from "@/components/CopyTrackingButton";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldAlert,
  Building2,
  PenLine,
  TrendingUp,
  Sparkles,
  Search,
  BellRing,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { DocumentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  let stats = {
    total: 0,
    pendingCoordinator: 0,
    pendingDirector: 0,
    approved: 0,
    returned: 0,
    escalated: 0,
    awaitingMySignature: 0,
  };

  let unitCounts: Array<{ code: string; name: string; count: number }> = [];

  let recentDocs: Array<{
    id: string;
    trackingNumber: string;
    title: string;
    status: DocumentStatus;
    isEscalated: boolean;
    rejectionCount: number;
    createdAt: Date;
    unit?: { code: string; name: string };
    uploader?: { firstName: string; lastName: string };
  }> = [];

  let myActionItems: Array<{
    id: string;
    trackingNumber: string;
    title: string;
    status: DocumentStatus;
    currentSignatoryIndex: number;
    unit?: { code: string; name: string } | null;
    uploader?: { firstName: string; lastName: string } | null;
  }> = [];

  if (isDatabaseConfigured) {
    try {
      const isDirectorOrAdmin = user.role === "DIRECTOR" || user.role === "ADMIN";
      const unitFilter = isDirectorOrAdmin ? {} : { unitId: user.unitId || undefined };

      const [
        total,
        pendingCoordinator,
        pendingDirector,
        approved,
        returned,
        escalated,
        awaitingMySignature,
        docs,
        allUnits,
        myItems,
      ] = await Promise.all([
        prisma.document.count({ where: unitFilter }),
        prisma.document.count({ where: { ...unitFilter, status: DocumentStatus.PENDING_COORDINATOR } }),
        prisma.document.count({ where: { ...unitFilter, status: DocumentStatus.PENDING_DIRECTOR } }),
        prisma.document.count({ where: { ...unitFilter, status: DocumentStatus.APPROVED } }),
        prisma.document.count({ where: { ...unitFilter, status: DocumentStatus.REJECTED_RETURNED } }),
        prisma.document.count({ where: { ...unitFilter, isEscalated: true } }),
        prisma.document.count({ where: { currentSignatoryId: user.id } }),
        prisma.document.findMany({
          where: unitFilter,
          orderBy: { updatedAt: "desc" },
          take: 6,
          include: { unit: true, uploader: true },
        }),
        prisma.unit.findMany({
          where: { isActive: true },
          include: { _count: { select: { documents: true } } },
          orderBy: { documents: { _count: "desc" } },
          take: 7,
        }),
        prisma.document.findMany({
          where: { currentSignatoryId: user.id },
          orderBy: { updatedAt: "desc" },
          take: 5,
          include: { unit: true, uploader: true },
        }),
      ]);

      stats = { total, pendingCoordinator, pendingDirector, approved, returned, escalated, awaitingMySignature };
      if (docs.length > 0) recentDocs = docs;

      if (allUnits.length > 0) {
        unitCounts = allUnits
          .filter((u) => u._count.documents > 0)
          .map((u) => ({ code: u.code, name: u.name, count: u._count.documents }));
      }

      myActionItems = myItems.map((d) => ({
        id: d.id,
        trackingNumber: d.trackingNumber,
        title: d.title,
        status: d.status,
        currentSignatoryIndex: d.currentSignatoryIndex,
        unit: d.unit,
        uploader: d.uploader,
      }));
    } catch {
      // Keep fallbacks
    }
  }

  const approvalRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Top Welcome Banner with Ambient Glassmorphism */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/90 relative overflow-hidden shadow-lg transition-all">
        <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-bl from-blue-600/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F2962]/10 border border-[#0F2962]/20 text-[#0F2962] text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Student & Alumni Services • FAITH Colleges</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
              {user.role === "DIRECTOR" || user.role === "ADMIN"
                ? "Executive oversight of all department workflows, electronic sign-offs, and compliance auditing."
                : `Active workspace for ${user.unitName || "Unit"}. Streamlining sequential reviews and approvals.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/dashboard/documents/new"
              className="px-4.5 py-3 rounded-xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white text-xs font-bold shadow-lg shadow-blue-950/20 hover:shadow-xl transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5 active:scale-98"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>New Document</span>
            </Link>

            {(user.role === "COORDINATOR" || user.role === "DIRECTOR" || user.role === "ADMIN") && (
              <Link
                href="/dashboard/approvals"
                className="px-4.5 py-3 rounded-xl bg-white/90 border border-slate-300/90 hover:border-slate-400 text-slate-800 text-xs font-bold shadow-xs hover:shadow-md transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5 active:scale-98"
              >
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Review Queue ({stats.pendingCoordinator + stats.pendingDirector})</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Priority Action Callout: My Assigned Reviews */}
      {myActionItems.length > 0 && (
        <div className="glass-panel-gold rounded-3xl p-6 sm:p-7 border border-amber-300/80 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0 animate-pulse">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="font-black text-sm sm:text-base text-amber-950 block">
                  {myActionItems.length} Document{myActionItems.length > 1 ? "s" : ""} Awaiting Your Signature
                </span>
                <span className="text-xs text-amber-900/90 block mt-0.5">
                  It is currently your turn in the sequential pipeline to review and apply your electronic signature.
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/approvals"
              className="px-4.5 py-2.5 rounded-xl bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold flex items-center gap-2 self-start sm:self-center transition shadow-md hover:shadow-lg shrink-0"
            >
              <span>Open Queue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Modern KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1 */}
        <div className="glass-panel glass-panel-interactive rounded-3xl p-5 sm:p-6 border border-white/90">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Total Ingested
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0F2962] border border-blue-200/60 flex items-center justify-center shadow-xs">
              <FileText className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.total}</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <TrendingUp className="w-3 h-3" />
              {approvalRate}% Done
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400 font-medium">Immutable records</p>
        </div>

        {/* KPI 2 */}
        <div className="glass-panel glass-panel-interactive rounded-3xl p-5 sm:p-6 border border-amber-200/80 bg-amber-50/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">
              Pending Coordinator
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 border border-amber-300/60 flex items-center justify-center shadow-xs">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-amber-950">{stats.pendingCoordinator}</span>
            <span className="text-[10px] font-extrabold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
              Level-1 Review
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-amber-800/80 font-medium">Unit-level validation</p>
        </div>

        {/* KPI 3 */}
        <div className="glass-panel glass-panel-interactive rounded-3xl p-5 sm:p-6 border border-purple-200/80 bg-purple-50/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-900">
              Pending Director
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 border border-purple-300/60 flex items-center justify-center shadow-xs">
              <Building2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-purple-950">{stats.pendingDirector}</span>
            <span className="text-[10px] font-extrabold text-purple-800 bg-purple-200/70 px-2 py-0.5 rounded-full">
              Level-2 Final
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-purple-800/80 font-medium">Executive approval stage</p>
        </div>

        {/* KPI 4 */}
        <div className="glass-panel glass-panel-interactive rounded-3xl p-5 sm:p-6 border border-emerald-200/80 bg-emerald-50/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900">
              Approved & Stamped
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300/60 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-950">{stats.approved}</span>
            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded-full">
              Verified
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-emerald-800/80 font-medium">With E-Signature stamp</p>
        </div>
      </div>

      {/* Secondary Row: Department Distribution & Quick Signer Card */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Unit Breakdown */}
        <div className="lg:col-span-8 glass-panel rounded-3xl p-6 sm:p-7 border border-white/90 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                Department Document Distribution
              </h2>
              <p className="text-xs text-slate-500 font-medium">Live volume metrics across SAS active units</p>
            </div>
            <span className="text-xs font-mono font-black text-[#0F2962] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              {stats.total} Total Documents
            </span>
          </div>

          <div className="space-y-4">
            {unitCounts.map((unit) => {
              const pct = stats.total > 0 ? Math.round((unit.count / stats.total) * 100) : 0;
              return (
                <div key={unit.code} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{unit.name} ({unit.code})</span>
                    <span className="font-mono text-slate-500 font-bold">{unit.count} docs ({pct}%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-linear-to-r from-[#0F2962] to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Electronic Signature Profile */}
        <div className="lg:col-span-4 glass-panel rounded-3xl p-6 sm:p-7 border border-white/90 flex flex-col justify-between space-y-5 bg-slate-50/60 shadow-sm">
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-[#0F2962] flex items-center justify-center shadow-xs">
              <PenLine className="w-5 h-5" />
            </div>
            <h2 className="text-base font-black text-slate-900">Smart E-Signature</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Institutional electronic signatures are embedded via Smart Anchor detection on review approvals.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 border border-slate-200 text-xs space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Registered Signer:</span>
              <span className="font-bold text-slate-900">{user.fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Designation:</span>
              <span className="font-bold text-[#0F2962]">{getRoleLabel(user.role)}</span>
            </div>
          </div>

          <Link
            href="/dashboard/approvals"
            className="w-full py-3 rounded-xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white text-xs font-bold text-center shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-98"
          >
            Manage Review Queue
          </Link>
        </div>
      </div>

      {/* Recent Submissions Table */}
      <div className="glass-panel rounded-3xl border border-white/90 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between bg-white/80">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900">Recent Document Ingestions</h2>
            <p className="text-xs text-slate-500 font-medium">Tracking sequential pipeline state and active version pointers</p>
          </div>
          <Link
            href="/dashboard/documents"
            className="text-xs font-bold text-[#0F2962] hover:text-blue-700 hover:underline flex items-center gap-1.5 transition"
          >
            <span>View Full Repository</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-3.5 px-6">Tracking Number</th>
                <th className="py-3.5 px-6">Title & Scope</th>
                <th className="py-3.5 px-6">Unit</th>
                <th className="py-3.5 px-6">Uploader</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/90 bg-white/60">
              {recentDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                  <td className="py-4 px-6">
                    <CopyTrackingButton trackingNumber={doc.trackingNumber} />
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-900 block truncate max-w-xs">
                      {doc.title}
                    </span>
                    {doc.isEscalated && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 mt-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Escalated (Rejections: {doc.rejectionCount})</span>
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-600">
                    {doc.unit?.code || "GENERAL"}
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    {doc.uploader ? `${doc.uploader.firstName} ${doc.uploader.lastName}` : "Staff Member"}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusBadgeClass(doc.status)}`}>
                      {getStatusLabel(doc.status)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/dashboard/documents/${doc.id}`}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-[#0F2962] hover:text-white hover:border-[#0F2962] text-slate-700 text-xs font-bold transition-all shadow-xs inline-block"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
