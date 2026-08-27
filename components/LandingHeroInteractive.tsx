"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Lock,
  Building2,
  Compass,
  KeyRound,
  Layers,
  FileLock2,
} from "lucide-react";

interface LandingHeroInteractiveProps {
  unitCount: number;
}

export default function LandingHeroInteractive({
  unitCount = 0,
}: LandingHeroInteractiveProps) {
  const securityPillars = [
    {
      icon: Lock,
      title: "Zero-Trust Access Perimeter",
      desc: "All document ingestion, approvals, and reviews require verified @firstasia.edu.ph institutional SSO credentials.",
      status: "STRICT ENFORCEMENT",
      statusColor: "text-emerald-400 border-emerald-500/30 bg-emerald-950/40",
    },
    {
      icon: Layers,
      title: "Unit-Scoped RBAC Tenancy",
      desc: "Cross-unit visibility is strictly isolated. Staff and Coordinators operate solely within their authorized departmental unit.",
      status: "ISOLATED BOUNDARY",
      statusColor: "text-blue-400 border-blue-500/30 bg-blue-950/40",
    },
    {
      icon: KeyRound,
      title: "Sequential Turn-Based Governance",
      desc: "Documents advance one signatory at a time with cryptographic checksum validation at each handover stage.",
      status: "TURN-BASED LOCK",
      statusColor: "text-amber-400 border-amber-500/30 bg-amber-950/40",
    },
    {
      icon: FileLock2,
      title: "Private Cloud Vault Preservation",
      desc: "Zero public endpoints. Document binaries are encrypted with AES-256 and accessible only via time-limited signed session tokens.",
      status: "PRIVATE VAULT",
      statusColor: "text-purple-400 border-purple-500/30 bg-purple-950/40",
    },
  ];

  return (
    <section className="relative pt-12 sm:pt-20 pb-20 sm:pb-28 overflow-hidden">
      {/* Background Cyber Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-137.5 bg-linear-to-tr from-blue-900/30 via-indigo-900/20 to-amber-500/10 blur-[130px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-1/3 right-0 w-125 h-125 bg-blue-950/40 blur-[140px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute bottom-10 left-0 w-112.5 h-112.5 bg-amber-500/5 blur-[150px] pointer-events-none -z-10 rounded-full" />

      {/* Cyber Grid Texture */}
      <div className="absolute inset-0 bg-grid-cyber opacity-40 bg-radial-vignette pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Column: Hero Copy & Actions */}
          <div className="lg:col-span-7 space-y-7 text-left">
            {/* Pill Tag with FAITH Crest */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 border border-blue-500/30 text-blue-300 text-xs font-semibold shadow-inner backdrop-blur-xl">
              <div className="w-5 h-5 rounded-full bg-white/95 p-0.5 flex items-center justify-center shrink-0 shadow-xs">
                <Image
                  src="/images/faith-crest.png"
                  alt="FAITH"
                  width={18}
                  height={18}
                  className="w-auto h-full object-contain"
                />
              </div>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>FAITH Colleges SAS • @firstasia.edu.ph Restricted Access</span>
            </div>

            {/* Main Heading with Animated Shimmer */}
            <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white pb-1">
              Cryptographic Governance &{" "}
              <span className="bg-linear-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent inline-block pb-2 pt-1 mt-1 animate-gradient-text">
                Sequential Workflow Engine
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-sm sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
              Engineered exclusively for the <strong>Student & Alumni Services (SAS)</strong> department at First Asia Institute of Technology and Humanities. Delivering zero-overwrite version trees, cryptographic SHA-256 integrity release vaults, precision visual coordinate e-signatures, and automated executive escalation.
            </p>

            {/* Action Buttons Matrix */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
              <Link
                href="/dashboard"
                className="px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl bg-linear-to-r from-[#1E40AF] via-[#1A3694] to-[#0F2962] hover:from-[#2563EB] hover:to-[#1E40AF] text-white font-black text-sm shadow-xl shadow-blue-900/40 border border-blue-400/40 transition-all duration-200 flex items-center justify-center gap-3 hover:-translate-y-0.5 active:scale-95 group cursor-pointer whitespace-nowrap"
              >
                <Building2 className="w-4.5 h-4.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Enter Staff Portal</span>
                <ArrowRight className="w-4 h-4 text-amber-300 group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="#units"
                className="px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-amber-400/50 text-slate-200 hover:text-amber-300 font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 backdrop-blur-md active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Explore SAS Units</span>
              </a>

              <Link
                href="/register"
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 underline underline-offset-4 transition py-2 text-center sm:text-left whitespace-nowrap"
              >
                Need staff verification? Apply here →
              </Link>
            </div>

            {/* Institutional Metrics Banner */}
            <div className="pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              <div className="stat-kpi-card p-3 rounded-2xl bg-slate-900/50 border border-slate-800/60">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono block">
                  {unitCount || 7}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Department Units</span>
              </div>
              <div className="stat-kpi-card p-3 rounded-2xl bg-slate-900/50 border border-slate-800/60">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono block">
                  100%
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  SHA-256 Validated
                </span>
              </div>
              <div className="stat-kpi-card p-3 rounded-2xl bg-slate-900/50 border border-slate-800/60">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono block">
                  RA 10173
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Privacy Certified
                </span>
              </div>
              <div className="stat-kpi-card p-3 rounded-2xl bg-slate-900/50 border border-slate-800/60">
                <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono block">&lt; 24h</span>
                <span className="text-[11px] text-slate-400 font-medium">Approval SLA Target</span>
              </div>
            </div>
          </div>

          {/* Right Column: Institutional Security & Governance Overview Console */}
          <div className="lg:col-span-5">
            <div className="glass-panel-dark rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-700/80 relative overflow-hidden backdrop-blur-2xl transition-all space-y-6">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Console Header with FAITH Emblem */}
              <div className="flex items-center justify-between border-b border-slate-800/90 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/95 p-1 flex items-center justify-center border border-amber-400/40 shadow-md shrink-0">
                    <Image
                      src="/images/faith-crest.png"
                      alt="FAITH Crest"
                      width={32}
                      height={32}
                      className="w-auto h-full object-contain"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">
                      FAITH Institutional Governance
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Student & Alumni Services • Perimeter v2.6
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Vault Locked
                </span>
              </div>

              {/* Security Pillars Cards */}
              <div className="space-y-3">
                {securityPillars.map((pillar, idx) => {
                  const Icon = pillar.icon;
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-amber-400" />
                          <h3 className="text-xs font-bold text-white">{pillar.title}</h3>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${pillar.statusColor}`}>
                          {pillar.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed pl-5.5">
                        {pillar.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Telemetry Card */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px] text-slate-300 font-mono">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Public Access: Fully Prohibited</span>
                </div>
                <span className="text-amber-400 font-bold">Authenticated SSO Only</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
