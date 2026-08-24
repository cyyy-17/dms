import Link from "next/link";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getStatusLabel, getStatusBadgeClass } from "@/lib/status-labels";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  ShieldAlert,
  Building2,
  PenLine,
  TrendingUp,
  Sparkles,
  Search,
  BellRing,
} from "lucide-react";
import { DocumentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Auth is enforced by the dashboard layout — user is always defined here
  const user = await getAuthenticatedUser();
  if (!user) return null; // Layout redirect handles this

  // Baseline stats
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
        // 6C: Documents directly assigned to current user's signature turn
        prisma.document.count({ where: { currentSignatoryId: user.id } }),
        prisma.document.findMany({
          where: unitFilter,
          orderBy: { updatedAt: "desc" },
          take: 6,
          include: { unit: true, uploader: true },
        }),
        // 2A: Only active units with documents
        prisma.unit.findMany({
          where: { isActive: true },
          include: { _count: { select: { documents: true } } },
          orderBy: { documents: { _count: "desc" } },
          take: 7,
        }),
        // 3B: My personal action items
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
      {/* Top Welcome & Fast Actions Header */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-200/80 bg-linear-to-r from-white via-slate-50 to-blue-50/30 relative overflow-hidden shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F2962]/10 border border-[#0F2962]/20 text-[#0F2962] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Student & Alumni Services DMS • FAITH Colleges</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
              {user.role === "DIRECTOR" || user.role === "ADMIN"
                ? "Overseeing all department streams, sequential sign-offs, and RA 10173 compliance."
                : `Active workspace for ${user.unitName || "Unit"}. Streamlining reviews & electronic approvals.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/dashboard/documents/new"
              className="px-4 py-2.5 rounded-xl bg-[#0F2962] hover:bg-[#091a42] text-white text-xs font-bold shadow-sm hover:shadow-md transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Ingest Document</span>
            </Link>

            {(user.role === "COORDINATOR" || user.role === "DIRECTOR" || user.role === "ADMIN") && (
              <Link
                href="/dashboard/approvals"
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-bold shadow-sm transition flex items-center gap-2"
              >
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Review Queue ({stats.pendingCoordinator + stats.pendingDirector})</span>
              </Link>
            )}

            <Link
              href="/dashboard/documents"
              className="p-2.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-semibold shadow-sm transition"
              title="Search Repository"
            >
              <Search className="w-4 h-4 text-slate-500" />
            </Link>
          </div>
        </div>
      </div>

      {/* Escalation Alert Banner (If Any) */}
      {stats.escalated > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-red-50/90 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-red-900 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-xs sm:text-sm block">
                {stats.escalated} Document(s) Auto-Escalated to Director Oversight
              </span>
              <span className="text-[11px] text-red-700/90 block">
                Sequential workflow automatically flagged revisions exceeding 2 rejections for executive review.
              </span>
            </div>
          </div>
          <Link
            href="/dashboard/documents?escalated=true"
            className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 self-start sm:self-center transition shadow-sm"
          >
            <span>Review Escalations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 3B: My Action Items — Personal Signature Queue */}
      {myActionItems.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-50 border border-blue-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-inner">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xs sm:text-sm text-blue-950 block">
                  {myActionItems.length} Document{myActionItems.length > 1 ? "s" : ""} Awaiting Your Signature
                </span>
                <span className="text-[11px] text-blue-700/90 block">
                  It is your turn to review and electronically sign the following:
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/approvals"
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 self-start sm:self-center transition shadow-sm shrink-0"
            >
              <span>Open Review Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {myActionItems.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/documents/${item.id}`}
                className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-white border border-blue-200 hover:border-blue-400 hover:shadow-xs transition group"
              >
                <div className="min-w-0">
                  <span className="text-[11px] font-mono font-bold text-blue-800 block">{item.trackingNumber}</span>
                  <span className="text-xs font-semibold text-slate-900 block truncate">{item.title}</span>
                  <span className="text-[10px] text-slate-500">{item.unit?.code || ""} · {item.uploader ? `${item.uploader.firstName} ${item.uploader.lastName}` : ""}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Modern KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="glass-card rounded-2xl p-5 border border-slate-200/90 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Ingested
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0F2962] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.total}</span>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              {approvalRate}% Done
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">Immutable audited records</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-amber-200 bg-amber-50/30 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Pending Coordinator
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-950">{stats.pendingCoordinator}</span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
              Level-1 Review
            </span>
          </div>
          <p className="mt-1 text-[11px] text-amber-700/80 font-medium">Awaiting unit sign-off</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-purple-200 bg-purple-50/30 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
              Pending Director
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-950">{stats.pendingDirector}</span>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full">
              Level-2 Final
            </span>
          </div>
          <p className="mt-1 text-[11px] text-purple-700/80 font-medium">Executive approval stage</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-emerald-200 bg-emerald-50/30 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Approved & Stamped
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-950">{stats.approved}</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
              Verified
            </span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-700/80 font-medium">With E-Signature stamp</p>
        </div>

        {/* 6C: Awaiting My Signature KPI */}
        {stats.awaitingMySignature > 0 && (
          <div className="lg:col-span-4 glass-card rounded-xl px-4 py-3 border border-blue-200 bg-blue-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <PenLine className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-900">
                {stats.awaitingMySignature} document{stats.awaitingMySignature > 1 ? "s" : ""} currently awaiting your e-signature
              </span>
            </div>
            <Link href="/dashboard/approvals" className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1">
              Sign Now <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* Secondary Row: Unit Distribution & Quick E-Sign Card */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Unit Breakdown Widget */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Department Document Distribution
              </h3>
              <p className="text-[11px] text-slate-500">Live volume metrics across SAS active units</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#0F2962]">{stats.total} Total</span>
          </div>

          <div className="space-y-3.5">
            {unitCounts.map((unit) => {
              const pct = stats.total > 0 ? Math.round((unit.count / stats.total) * 100) : 0;
              return (
                <div key={unit.code} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{unit.name} ({unit.code})</span>
                    <span className="font-mono text-slate-500 font-semibold">{unit.count} docs ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-[#0F2962] to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Electronic Signature Profile Card */}
        <div className="lg:col-span-4 glass-card rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-4 bg-slate-50/50">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0F2962] flex items-center justify-center">
              <PenLine className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Smart E-Signature</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Institutional electronic signatures are embedded via Smart Anchor detection on review approvals.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Registered Signer:</span>
              <span className="font-bold text-slate-900">{user.fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Designation:</span>
              <span className="font-mono font-bold text-[#0F2962]">{user.role}</span>
            </div>
          </div>

          <Link
            href="/dashboard/approvals"
            className="w-full py-2.5 rounded-xl bg-[#0F2962] hover:bg-[#091a42] text-white text-xs font-bold text-center shadow-sm transition"
          >
            Manage Review Queue
          </Link>
        </div>
      </div>

      {/* Recent Submissions Table */}
      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Document Ingestions</h2>
            <p className="text-xs text-slate-500">Tracking sequential state and active version pointers</p>
          </div>
          <Link
            href="/dashboard/documents"
            className="text-xs font-bold text-[#0F2962] hover:underline flex items-center gap-1"
          >
            <span>View All Repository</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-6">Tracking Number</th>
                <th className="py-3 px-6">Title & Scope</th>
                <th className="py-3 px-6">Unit</th>
                <th className="py-3 px-6">Uploader</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {recentDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 px-6 font-mono font-bold text-slate-800">
                    {doc.trackingNumber}
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-slate-900 block truncate max-w-xs">
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
                      className="px-3 py-1 rounded-lg border border-slate-300 hover:bg-[#0F2962] hover:text-white hover:border-[#0F2962] text-slate-700 text-xs font-bold transition inline-block"
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
