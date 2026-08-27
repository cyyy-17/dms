"use client";

import {
  FileSignature,
  ShieldCheck,
  Lock,
  Layers,
  KeyRound,
  FileLock2,
  Crosshair,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function LandingSignatureShowcase() {
  const architecturalFeatures = [
    {
      icon: Crosshair,
      title: "Interactive 1:1 Visual Coordinate Placer",
      desc: "Signatories precisely position their electronic signature on the vector PDF canvas before approval, ensuring perfect document alignment across multi-page agreements.",
      badge: "Sub-Pixel Precision",
    },
    {
      icon: Layers,
      title: "Pure Solid Knockout E-Signature",
      desc: "Draws an authentic, non-transparent signature image backed by a solid white knockout layer (opacity 1.0), preventing text bleed-through without clunky boxed frames.",
      badge: "Pure Solid Ink",
    },
    {
      icon: KeyRound,
      title: "Complete Official Credentials & Lineage",
      desc: "Every stamp is bound to the signatory's official academic title, middle initial, suffix (e.g. Dr. Aljon M. Tolentino, PhD), verified institutional UID, and timestamp.",
      badge: "Official Credentials",
    },
    {
      icon: FileLock2,
      title: "Cryptographic SHA-256 Release Vault",
      desc: "Upon final executive sign-off, binaries are locked in private encrypted object storage with a 1-click verifiable SHA-256 integrity release vault.",
      badge: "SHA-256 Vault",
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
          Visual Coordinate Placer & Solid Knockout E-Signature Engine
        </h2>
        <p className="text-sm sm:text-base text-slate-300">
          Engineered for institutional rigor. Combines interactive 1:1 vector placement, solid white knockout signature stamping, and instant cryptographic SHA-256 vault sealing.
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
                  Interactive Stamping Preview
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                100% Solid Knockout
              </span>
            </div>

            {/* Interactive Vector Signature Card Mockup */}
            <div className="p-4 rounded-2xl bg-white text-slate-900 shadow-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-500 uppercase">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Stamping Vector Canvas</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono text-[9px] font-bold">
                  ✓ Coordinates Set
                </span>
              </div>

              {/* Realistic Document Context with Stamped Solid Signature */}
              <div className="relative p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-2">
                <p className="italic text-[10px] text-slate-400">
                  &ldquo;...hereby endorsed and approved in accordance with Student & Alumni Services institutional standards.&rdquo;
                </p>

                {/* Stamped Signature Box (Solid White Knockout) */}
                <div className="p-2.5 bg-white rounded-lg border border-blue-400 shadow-md ring-2 ring-blue-500/20 space-y-1">
                  <div className="font-serif italic font-black text-blue-950 text-base tracking-wide flex items-center justify-between">
                    <span>Authorized Signatory</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="border-t border-slate-200 pt-1 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-800">OFFICIAL SIGNATORY, PhD</span>
                    <span className="font-mono text-slate-400">Page 1 • (X: 380, Y: 520)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                <span>SHA-256: 7f83b1657ff...</span>
                <span className="text-emerald-700 font-bold">Encrypted Lock</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center gap-2.5 text-xs text-blue-300">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Zero-Trust Architecture: Document binaries and signatory pads are restricted exclusively behind authenticated sessions.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
