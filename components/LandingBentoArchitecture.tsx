"use client";

import {
  GitBranch,
  Lock,
  ShieldCheck,
  Clock,
  Database,
  Award,
} from "lucide-react";

export default function LandingBentoArchitecture() {
  return (
    <section id="architecture" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-225 h-125 bg-linear-to-tr from-blue-900/10 via-indigo-900/10 to-amber-500/5 blur-[150px] pointer-events-none -z-10 rounded-full" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/25 text-xs font-bold">
          <Award className="w-3.5 h-3.5" />
          <span>Enterprise Rigor & Governance</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Engineered for Institutional Resilience
        </h2>
        <p className="text-sm sm:text-base text-slate-300">
          A modern high-availability architecture replacing vulnerable manual paperwork with cryptographic certainty.
        </p>
      </div>

      {/* Bento Grid (6 Varied Cards) */}
      <div className="grid md:grid-cols-12 gap-6">
        {/* Bento 1: Zero-Overwrite Version Trees (Span 8) */}
        <div className="md:col-span-8 p-7 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-950/90 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-md">
                <GitBranch className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-full">
                Immutable Lineage
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                Zero-Overwrite Version Trees (v1.0 → v2.0 Lineage)
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2 max-w-2xl">
                When a document is returned with reviewer remarks, resubmissions never overwrite or erase past drafts. The system branches an immutable version node with exact revision diff logs, preserving the complete institutional audit history.
              </p>
            </div>

            {/* Version Branch Simulation Visual */}
            <div className="grid sm:grid-cols-3 gap-3 pt-2 font-mono text-[11px]">
              <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400">
                  <span>v1.0 (Original)</span>
                  <span className="text-emerald-400">Archived</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 truncate">
                  SHA: 7f83b16...
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400">
                  <span>v1.1 (Remarks)</span>
                  <span className="text-amber-400">Returned</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 truncate">
                  SHA: e3b0c44...
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/40 text-blue-300">
                <div className="flex items-center justify-between font-bold">
                  <span>v2.0 (Approved)</span>
                  <span className="text-emerald-400">Sealed</span>
                </div>
                <div className="text-[10px] text-blue-400 mt-1 truncate">
                  SHA: a1b2c3d...
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bento 2: Unit-Scoped RBAC Tenancy (Span 4) */}
        <div className="md:col-span-4 p-7 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 shadow-xl flex flex-col justify-between group">
          <div className="space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-950/90 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
              Unit-Scoped RBAC Zero-Trust Tenancy
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Staff and Coordinators are strictly partitioned within their own Department Unit (GCO, AAPO, SOA, etc.), preventing cross-unit visibility leaks while granting the Director unified oversight.
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1 rounded-full w-fit mt-4">
            Zero-Trust Isolation
          </span>
        </div>

        {/* Bento 3: RA 10173 Audit Stamping (Span 4) */}
        <div className="md:col-span-4 p-7 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 shadow-xl flex flex-col justify-between group">
          <div className="space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-950/90 border border-blue-500/40 text-emerald-400 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
              RA 10173 National Audit Stamping
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Full Philippine Data Privacy Act compliance with real-time tamper-evident audit logging of every document creation, reviewer endorsement, return, and binary download event.
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-full w-fit mt-4">
            National Compliance
          </span>
        </div>

        {/* Bento 4: Automated Expiry & Retention Cron (Span 4) */}
        <div className="md:col-span-4 p-7 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 shadow-xl flex flex-col justify-between group">
          <div className="space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-950/90 border border-blue-500/40 text-amber-400 flex items-center justify-center shadow-md">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
              Automated Expiry & Retention Workers
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Automated cron workers audit institutional covenants, dispatching proactive 30-day notifications prior to expiration and enforcing document lifecycle retention protocols.
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-full w-fit mt-4">
            Automated Cron
          </span>
        </div>

        {/* Bento 5: Supabase Private Encrypted Vault (Span 4) */}
        <div className="md:col-span-4 p-7 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 shadow-xl flex flex-col justify-between group">
          <div className="space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-950/90 border border-blue-500/40 text-purple-400 flex items-center justify-center shadow-md">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
              Encrypted Private Cloud Storage
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Document binaries are secured in private object storage vaults with time-limited signed access tokens, preventing public URL leaks and unauthorized file scraping.
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-purple-400 bg-purple-950/40 border border-purple-500/30 px-3 py-1 rounded-full w-fit mt-4">
            AES-256 Vault
          </span>
        </div>
      </div>
    </section>
  );
}
