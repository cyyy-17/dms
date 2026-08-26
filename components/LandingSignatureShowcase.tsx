"use client";

import {
  FileSignature,
  ShieldCheck,
  Lock,
  Cpu,
  Layers,
  CheckCircle2,
  KeyRound,
  FileLock2,
  FileCheck,
} from "lucide-react";

export default function LandingSignatureShowcase() {
  const architecturalFeatures = [
    {
      icon: Cpu,
      title: "Sub-Pixel Dynamic Coordinate Parsing",
      desc: "Analyzes document geometry to locate signatory title blocks mathematically, eliminating manual drag-and-drop placement.",
      badge: "Automated Placement",
    },
    {
      icon: Layers,
      title: "Zero Margin & Pagination Drift",
      desc: "Embeds vector signature paths directly into PDF content streams without altering line-height, bounding boxes, or page formatting.",
      badge: "0px Layout Shift",
    },
    {
      icon: KeyRound,
      title: "Session-Bound Cryptographic Hashing",
      desc: "Every electronic signature is cryptographically bound to the reviewer's authenticated institutional UID, IP hash, and audit timestamp.",
      badge: "RA 10173 Compliant",
    },
    {
      icon: FileLock2,
      title: "Private Vault Storage & Tamper Seal",
      desc: "Upon final executive sign-off, binaries are locked in private encrypted object storage with SHA-256 integrity verification.",
      badge: "AES-256 Vault",
    },
  ];

  return (
    <section id="signatures" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 right-1/4 w-150 h-87.5 bg-amber-500/10 blur-[130px] pointer-events-none -z-10 rounded-full" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 text-xs font-bold">
          <FileSignature className="w-3.5 h-3.5" />
          <span>Proprietary E-Signature Engine</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Smart Anchor Cryptographic Stamping Architecture
        </h2>
        <p className="text-sm sm:text-base text-slate-300">
          Engineered for institutional security. Replaces legacy scan-and-paste distortions with intelligent vector anchoring executed exclusively within authenticated staff sessions.
        </p>
      </div>

      {/* 2-Column Architectural Overview */}
      <div className="grid lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: 4 Key Technical Features */}
        <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
          {architecturalFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-400/40 transition-all duration-200 space-y-3 shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center shadow-xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white leading-snug">{feat.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400/90 bg-amber-950/40 border border-amber-500/20 px-2.5 py-0.5 rounded-full w-fit">
                  {feat.badge}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right Column: High-Level Security Architecture Visualizer */}
        <div className="lg:col-span-5">
          <div className="glass-panel-dark rounded-3xl p-7 border border-slate-700/80 shadow-2xl backdrop-blur-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Internal Signing Security Pipeline
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Zero-Public Access
              </span>
            </div>

            {/* Visual Security Pipeline Nodes */}
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>1. Authenticated Session Gate</span>
                  <span className="text-emerald-400 font-mono text-[10px]">Verified</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Reviewer must authenticate via @firstasia.edu.ph institutional SSO.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>2. Dynamic Anchor Computation</span>
                  <span className="text-blue-400 font-mono text-[10px]">Sub-Pixel</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Vector engine computes signatory bounding boxes without manual alignment.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>3. Tamper-Evident SHA-256 Seal</span>
                  <span className="text-amber-400 font-mono text-[10px]">Immutable</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Signed document binary is stamped with cryptographic checksum & stored in private vault.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center gap-2.5 text-xs text-blue-300">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>All signing pads and document functions are restricted exclusively inside staff accounts.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
