import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getStatusLabel, getStatusBadgeClass, getRoleLabel } from "@/lib/status-labels";
import CopyTrackingButton from "@/components/CopyTrackingButton";
import DataTableWrapper from "@/components/DataTableWrapper";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Plus,
  ArrowRight,
  Building2,
  PenLine,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { DocumentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  let stats = {
    total: 0,
    pendingCoordinator: 0,
    pendingDirector: 0,
    approved: 0,
    returned: 0,
    escalated: 0,
    awaitingMySignature: 0,
  };

  let activeUnitCount = 0;
  let totalVersionsCount = 0;
  let verifiedVersionsCount = 0;
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
        totalActiveUnits,
        totalVersions,
        sha256VerifiedVersions,
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
        prisma.unit.count({ where: { isActive: true } }),
        prisma.documentVersion.count(),
        prisma.documentVersion.count({ where: { sha256Checksum: { not: "" } } }),
      ]);

      stats = { total, pendingCoordinator, pendingDirector, approved, returned, escalated, awaitingMySignature };
      recentDocs = docs;
      activeUnitCount = totalActiveUnits;
      totalVersionsCount = totalVersions;
      verifiedVersionsCount = sha256VerifiedVersions;

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
  const slaOnTimeRate = stats.total > 0 ? Math.round(((stats.total - stats.escalated) / stats.total) * 100) : 100;
  const sha256Rate = totalVersionsCount > 0 ? Math.round((verifiedVersionsCount / totalVersionsCount) * 100) : 100;

  const currentHour = (new Date().getUTCHours() + 8) % 24;
  const timeOfDayGreeting =
    currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
      {/* Main Welcome Hero Banner */}
      <div className="glass-panel border-gradient-gold rounded-3xl p-5 sm:p-8 border border-white/90 relative overflow-hidden shadow-xl transition-all">
        <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-bl from-blue-600/15 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/95 p-1.5 items-center justify-center border border-amber-400/50 shadow-md shrink-0">
              <Image
                src="/images/faith-crest.png"
                alt="FAITH Crest"
                width={48}
                height={48}
                priority
                className="w-auto h-full object-contain"
              />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F2962] text-amber-300 text-xs font-black shadow-inner">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Student & Alumni Services (SAS)</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-300">
                  <span>FAITH Colleges • Tanauan Campus</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>System Synchronized</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                {timeOfDayGreeting}, {user.firstName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed font-medium">
                {user.role === "DIRECTOR" || user.role === "ADMIN"
                  ? "Executive governance portal for department workflows, electronic sign-offs, and compliance auditing."
                  : `Operational repository and sequential workflow queue for ${user.unitName || "Unit"}.`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            {stats.awaitingMySignature > 0 ? (
              <>
                <Link
                  href="/dashboard/approvals"
                  className="px-4.5 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black shadow-lg shadow-amber-950/20 hover:shadow-xl transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5 active:scale-98"
                >
                  <PenLine className="w-4 h-4 text-slate-950" />
                  <span>Sign Pending Documents ({stats.awaitingMySignature})</span>
                </Link>
                <Link
                  href="/dashboard/documents/new"
                  className="px-4.5 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-white/95 border border-slate-300 hover:border-blue-400 text-slate-800 text-xs font-extrabold shadow-xs hover:shadow-md transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5 active:scale-98"
                >
                  <Plus className="w-4 h-4 text-slate-600" />
                  <span>New Document</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard/documents/new"
                  className="px-4.5 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white text-xs font-extrabold shadow-lg shadow-blue-950/25 hover:shadow-xl transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5 active:scale-98"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>New Document</span>
                </Link>
                {(user.role === "COORDINATOR" || user.role === "DIRECTOR" || user.role === "ADMIN") && (stats.pendingCoordinator + stats.pendingDirector > 0) && (
                  <Link
                    href="/dashboard/approvals"
                    className="px-4.5 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-white/95 border border-slate-300 hover:border-blue-400 text-slate-800 text-xs font-extrabold shadow-xs hover:shadow-md transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5 active:scale-98"
                  >
                    <Clock className="w-4 h-4 text-slate-600" />
                    <span>Review Queue ({stats.pendingCoordinator + stats.pendingDirector})</span>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* Real-time Institutional Health Trust Ribbon */}
        <div className="mt-6 pt-5 border-t border-slate-200/70 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Review SLA</span>
              <span className="font-bold text-slate-900">{slaOnTimeRate}% On-Time</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Integrity</span>
              <span className="font-bold text-slate-900">{sha256Rate}% SHA-256</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Privacy Standard</span>
              <span className="font-bold text-slate-900">RA 10173 Compliant</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black block">Department Units</span>
              <span className="font-bold text-slate-900">
                {activeUnitCount} Active {activeUnitCount === 1 ? "Tenancy" : "Tenancies"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Action Callout: My Assigned Reviews */}
      {myActionItems.length > 0 && (
        <div className="glass-panel-gold glow-amber rounded-3xl p-6 sm:p-7 border border-amber-300 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shrink-0">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="font-black text-sm sm:text-base text-amber-950 block">
                  {myActionItems.length} Document{myActionItems.length > 1 ? "s" : ""} Requiring Your Electronic Signature
                </span>
                <span className="text-xs text-amber-900/90 font-medium block mt-0.5">
                  It is currently your designated turn in the sequential pipeline to review and apply cryptographic sign-off.
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/approvals"
              className="px-5 py-3 rounded-xl bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-extrabold flex items-center gap-2 self-start sm:self-center transition shadow-md hover:shadow-lg shrink-0 hover:-translate-y-0.5 active:scale-98"
            >
              <span>Open Review Queue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Miller's Law: 3-Cluster Cognitive Metrics Architecture */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#0F2962]" />
            <span>Operational &amp; Governance Metrics</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-400">Real-time Telemetry</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* KPI 1: Total Ingested */}
          <div className="glass-panel stat-kpi-card glow-blue rounded-3xl p-5 sm:p-6 border border-white/90 bg-white/85 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Total Ingested
              </span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0F2962] border border-blue-200/80 flex items-center justify-center shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3.5 flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{stats.total}</span>
              <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <TrendingUp className="w-3 h-3" />
                {approvalRate}% Sealed
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400 font-medium">Immutable cryptographed records</p>
          </div>

          {/* KPI 2: In Sequential Review */}
          <div className="glass-panel stat-kpi-card glow-amber rounded-3xl p-5 sm:p-6 border border-amber-200/80 bg-amber-50/40 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">
                In Sequential Review
              </span>
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300/80 flex items-center justify-center shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3.5 flex items-baseline justify-between">
              <span className="text-3xl font-black text-amber-950 tracking-tight">{stats.pendingCoordinator + stats.pendingDirector}</span>
              <span className="text-[10px] font-extrabold text-amber-800 bg-amber-200/70 px-2.5 py-0.5 rounded-full">
                In Pipeline
              </span>
            </div>
            <p className="mt-2 text-[11px] text-amber-800/80 font-medium">Assigned signatory flow active</p>
          </div>

          {/* KPI 3: Awaiting My Turn */}
          <div className="glass-panel stat-kpi-card glow-purple rounded-3xl p-5 sm:p-6 border border-purple-200/80 bg-purple-50/40 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-900">
                Awaiting My Turn
              </span>
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 border border-purple-300/80 flex items-center justify-center shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3.5 flex items-baseline justify-between">
              <span className="text-3xl font-black text-purple-950 tracking-tight">{stats.awaitingMySignature}</span>
              <span className="text-[10px] font-extrabold text-purple-800 bg-purple-200/70 px-2.5 py-0.5 rounded-full">
                My Action
              </span>
            </div>
            <p className="mt-2 text-[11px] text-purple-800/80 font-medium">Ready for your e-signature</p>
          </div>

          {/* KPI 4: Approved & Stamped */}
          <div className="glass-panel stat-kpi-card glow-emerald rounded-3xl p-5 sm:p-6 border border-emerald-200/80 bg-emerald-50/40 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900">
                Approved & Stamped
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300/80 flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3.5 flex items-baseline justify-between">
              <span className="text-3xl font-black text-emerald-950 tracking-tight">{stats.approved}</span>
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-200/70 px-2.5 py-0.5 rounded-full">
                Cryptosealed
              </span>
            </div>
            <p className="mt-2 text-[11px] text-emerald-800/80 font-medium">With Smart Anchor E-Signature</p>
          </div>
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
            {unitCounts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1.5">
                <Building2 className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-600 text-xs">No active departmental documents</p>
                <p className="text-[11px] text-slate-400">Department distribution metrics will appear as units upload records.</p>
              </div>
            ) : (
              unitCounts.map((unit) => {
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
              })
            )}
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
              <span className="text-slate-500 font-medium">Role Authority:</span>
              <span className="font-bold text-slate-900">{getRoleLabel(user.role)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Unit Tenancy:</span>
              <span className="font-bold text-slate-900">{user.unitCode || "Global SAS"}</span>
            </div>
          </div>

          <Link
            href="/dashboard/profile"
            className="w-full py-3 rounded-xl bg-white border border-slate-300 hover:bg-blue-50 hover:text-[#0F2962] hover:border-blue-300 text-slate-700 text-xs font-bold text-center block transition shadow-xs cursor-pointer hover:-translate-y-0.5 active:scale-98"
          >
            Manage Signature Profile
          </Link>
        </div>
      </div>

      {/* Tertiary Section: Recent Audit Ingestions Table */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/90 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Recent Repository Ingestions
            </h2>
            <p className="text-xs text-slate-500 font-medium">Audit registry of documents across SAS tenancy</p>
          </div>
          <Link
            href="/dashboard/documents"
            className="text-xs font-bold text-[#0F2962] hover:text-blue-700 transition flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Complete Repository</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <DataTableWrapper>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-3 px-3 sm:py-3.5 sm:px-6">Tracking Number</th>
                <th className="py-3 px-3 sm:py-3.5 sm:px-6">Title & Scope</th>
                <th className="hidden sm:table-cell py-3 px-3 sm:py-3.5 sm:px-6">Unit</th>
                <th className="hidden md:table-cell py-3 px-3 sm:py-3.5 sm:px-6">Uploader</th>
                <th className="py-3 px-3 sm:py-3.5 sm:px-6">Status</th>
                <th className="py-3 px-3 sm:py-3.5 sm:px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/90 bg-white/60">
              {recentDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 sm:px-6 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <span className="font-bold text-slate-600 text-xs">No documents registered yet</span>
                      <span className="text-[11px] text-slate-400">
                        Ingest a new document or wait for unit submissions.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                recentDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    className={`transition-colors duration-150 group ${
                      doc.isEscalated
                        ? "bg-rose-50/40 hover:bg-rose-50/70 border-l-4 border-l-rose-500"
                        : "hover:bg-blue-50/50"
                    }`}
                  >
                    <td className="py-3 px-3 sm:py-4 sm:px-6">
                      <CopyTrackingButton trackingNumber={doc.trackingNumber} />
                    </td>
                    <td className="py-3 px-3 sm:py-4 sm:px-6">
                      <Link
                        href={`/dashboard/documents/${doc.id}`}
                        className="font-bold text-slate-900 block truncate max-w-35 xs:max-w-xs sm:max-w-md group-hover:text-[#0F2962] transition-colors"
                      >
                        {doc.title}
                      </Link>
                      {doc.isEscalated && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 mt-0.5 bg-rose-100/80 px-2 py-0.2 rounded-md border border-rose-200">
                          <AlertTriangle className="w-3 h-3 shrink-0 text-rose-600" />
                          <span>Escalated (Rejections: {doc.rejectionCount})</span>
                        </span>
                      )}
                    </td>
                    <td className="hidden sm:table-cell py-3 px-3 sm:py-4 sm:px-6 font-medium text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-[11px]">
                        {doc.unit?.code || "GENERAL"}
                      </span>
                    </td>
                    <td className="hidden md:table-cell py-3 px-3 sm:py-4 sm:px-6 text-slate-600 font-medium">
                      {doc.uploader ? `${doc.uploader.firstName} ${doc.uploader.lastName}` : "Staff Member"}
                    </td>
                    <td className="py-3 px-3 sm:py-4 sm:px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold ${getStatusBadgeClass(doc.status)}`}>
                        {getStatusLabel(doc.status)}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:py-4 sm:px-6 text-right">
                      <Link
                        href={`/dashboard/documents/${doc.id}`}
                        className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-slate-300 hover:bg-[#0F2962] hover:text-white hover:border-[#0F2962] text-slate-700 text-xs font-bold transition-all shadow-xs inline-block hover:-translate-y-0.5 active:scale-98"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableWrapper>
      </div>
    </div>
  );
}
