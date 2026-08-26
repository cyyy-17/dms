"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  ArrowRight,
  Lock,
  Building2,
  CheckCircle2,
  FileSignature,
  Play,
  Pause,
  RotateCcw,
  Search,
  Check,
} from "lucide-react";

interface LandingHeroInteractiveProps {
  unitCount: number;
}

export default function LandingHeroInteractive({ unitCount = 7 }: LandingHeroInteractiveProps) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const simulationSteps = [
    {
      id: 0,
      title: "1. Intake & Checksum",
      subtitle: "Originating Staff Ingestion",
      badge: "SHA-256 Anchored",
      badgeColor: "bg-cyan-950/80 text-cyan-300 border-cyan-500/30",
      description:
        "Uploader selects PDF covenant. Client generates SHA-256 digest to register immutable binary integrity prior to private cloud storage.",
      actor: "Engr. Rafael Gomez (AAPO Coordinator)",
      status: "Ingested & Checksum Verified",
      timestamp: "Today at 09:15:22 GMT+8",
      hashSnippet: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      actionPreview: "SHA-256 Digest Computed",
      version: "v1.0 (Initial Ingestion)",
    },
    {
      id: 1,
      title: "2. Coordinator Review",
      subtitle: "Unit-Level Verification",
      badge: "Turn-Based Lock",
      badgeColor: "bg-blue-950/80 text-blue-300 border-blue-500/30",
      description:
        "Sequential routing enforces strict turn progression. The Unit Coordinator inspects line-item covenants and endorses forward with no margin drift.",
      actor: "Prof. Carmela Santos (Unit Head)",
      status: "Endorsed & Transferred",
      timestamp: "Today at 10:04:10 GMT+8",
      hashSnippet: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      actionPreview: "Endorsement Remark Attached",
      version: "v1.0 (Endorsed)",
    },
    {
      id: 2,
      title: "3. Smart Anchor E-Sign",
      subtitle: "Cryptographic Vector Stamping",
      badge: "Vector Signature",
      badgeColor: "bg-amber-950/80 text-amber-300 border-amber-500/30",
      description:
        "Dynamic anchor parser detects signatory line and renders cryptographic vector stroke with reviewer identity, IP verification, and timestamp.",
      actor: "Atty. Dominador Reyes (Legal Reviewer)",
      status: "Digitally Signed",
      timestamp: "Today at 11:32:45 GMT+8",
      hashSnippet: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      actionPreview: "Vector Signature Applied",
      version: "v1.0 (Signed)",
    },
    {
      id: 3,
      title: "4. Director Final Seal",
      subtitle: "Executive Approval & Archive",
      badge: "Sealed & Locked",
      badgeColor: "bg-emerald-950/80 text-emerald-300 border-emerald-500/30",
      description:
        "SAS Department Director grants final executive approval. Status transitions to APPROVED with immutable preservation lock and searchable audit trail.",
      actor: "Dr. Maria Helena Torres (SAS Director)",
      status: "APPROVED • Full Institutional Seal",
      timestamp: "Today at 14:02:18 GMT+8",
      hashSnippet: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      actionPreview: "Preserved in Private Vault",
      version: "v1.0 (Approved Immutable)",
    },
  ];

  // Auto-play simulation loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % simulationSteps.length);
      }, 4200);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, simulationSteps.length]);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(simulationSteps[activeStep].hashSnippet);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const current = simulationSteps[activeStep];

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
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 border border-blue-500/30 text-blue-300 text-xs font-semibold shadow-inner backdrop-blur-xl">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Restricted Institutional Access • @firstasia.edu.ph</span>
            </div>

            {/* Main Heading with Animated Shimmer */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              Cryptographic Governance &{" "}
              <span className="bg-linear-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent block mt-1 animate-gradient-text">
                Sequential Workflow Engine
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
              Engineered exclusively for the <strong>Student & Alumni Services (SAS)</strong> department at FAITH Colleges. Delivering zero-overwrite version trees, cryptographic SHA-256 lineage, Smart Anchor vector e-signatures, and automated executive escalation.
            </p>

            {/* Action Buttons Matrix */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/dashboard"
                className="px-7 py-4 rounded-2xl bg-linear-to-r from-[#1E40AF] via-[#1A3694] to-[#0F2962] hover:from-[#2563EB] hover:to-[#1E40AF] text-white font-black text-sm shadow-xl shadow-blue-900/40 border border-blue-400/40 transition-all duration-200 flex items-center gap-3 hover:-translate-y-0.5 active:scale-95 group cursor-pointer"
              >
                <Building2 className="w-4.5 h-4.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Enter Staff Portal</span>
                <ArrowRight className="w-4 h-4 text-amber-300 group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="#tracker"
                className="px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-amber-400/50 text-slate-200 hover:text-amber-300 font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 backdrop-blur-md active:scale-95 flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-amber-400" />
                <span>Verify Document</span>
              </a>

              <Link
                href="/register"
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 underline underline-offset-4 transition py-2"
              >
                Need staff verification? Apply here →
              </Link>
            </div>

            {/* Institutional Metrics Banner */}
            <div className="pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              <div className="stat-kpi-card p-3 rounded-2xl bg-slate-900/50 border border-slate-800/60">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono block">
                  {unitCount}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">SAS Units Integrated</span>
              </div>
              <div className="stat-kpi-card p-3 rounded-2xl bg-slate-900/50 border border-slate-800/60">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono block">100%</span>
                <span className="text-[11px] text-slate-400 font-medium">SHA-256 Audited</span>
              </div>
              <div className="stat-kpi-card p-3 rounded-2xl bg-slate-900/50 border border-slate-800/60">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono block">RA 10173</span>
                <span className="text-[11px] text-slate-400 font-medium">Data Privacy Certified</span>
              </div>
              <div className="stat-kpi-card p-3 rounded-2xl bg-slate-900/50 border border-slate-800/60">
                <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono block">&lt;24h</span>
                <span className="text-[11px] text-slate-400 font-medium">Approval SLA Target</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Document Workflow Simulator */}
          <div className="lg:col-span-5">
            <div className="glass-panel-dark rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-700/80 relative overflow-hidden backdrop-blur-2xl transition-all">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Simulation Header & Controls */}
              <div className="flex items-center justify-between border-b border-slate-800/90 pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-950 border border-blue-500/40 flex items-center justify-center text-amber-400 shadow-md">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-black text-blue-300 block">
                      DOC-SAS-2026-0842
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      AAPO • Industry MOA Partnership
                    </span>
                  </div>
                </div>

                {/* Play / Pause / Step Controls */}
                <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition"
                    title={isPlaying ? "Pause Auto-Simulation" : "Play Auto-Simulation"}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(0)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Reset to Step 1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Interactive Step Switcher Bar */}
              <div className="grid grid-cols-4 gap-1.5 mb-5 p-1 bg-slate-900/80 rounded-2xl border border-slate-800">
                {simulationSteps.map((step, idx) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      setActiveStep(idx);
                      setIsPlaying(false);
                    }}
                    className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all duration-200 text-center cursor-pointer ${
                      activeStep === idx
                        ? "bg-linear-to-r from-[#1E40AF] to-[#0F2962] text-amber-300 shadow-md border border-blue-400/40"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    <span>Stage {idx + 1}</span>
                  </button>
                ))}
              </div>

              {/* Active Step Visual Showcase Card */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 relative overflow-hidden transition-all duration-300">
                {/* Step Progress Line */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-400 text-blue-300 flex items-center justify-center text-[10px] font-mono">
                      0{activeStep + 1}
                    </span>
                    <span>{current.title}</span>
                  </span>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${current.badgeColor}`}>
                    {current.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {current.description}
                </p>

                {/* Actor & Action Pill */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Signatory Turn:</span>
                    <span className="text-white font-semibold">{current.actor}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Workflow Status:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {current.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-900">
                    <span>{current.version}</span>
                    <span>{current.timestamp}</span>
                  </div>
                </div>

                {/* Interactive Dynamic Stamp Visualization for Steps 3 & 4 */}
                {(activeStep === 2 || activeStep === 3) && (
                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                        <FileSignature className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-amber-300 block">
                          Smart Anchor Vector Stamp Active
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Preserves 0px margin dislocation
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                      VERIFIED
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Cryptographic Fingerprint Box */}
              <div className="mt-4 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Cryptographic Lineage Lock</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyHash}
                    className="text-amber-400 hover:text-amber-300 text-[10px] font-semibold flex items-center gap-1 transition"
                  >
                    {copiedHash ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <span>Copy SHA-256</span>
                    )}
                  </button>
                </div>
                <code className="text-[10px] font-mono text-slate-300 break-all block bg-black/50 p-2 rounded-xl border border-slate-800/80 select-all">
                  SHA-256: {current.hashSnippet}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
