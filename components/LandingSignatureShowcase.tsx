"use client";

import { useState } from "react";
import {
  FileSignature,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  Stamp,
} from "lucide-react";

export default function LandingSignatureShowcase() {
  const [activeStampMode, setActiveStampMode] = useState<"stylus" | "seal" | "director">("director");

  return (
    <section id="signatures" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 right-1/4 w-150 h-87.5 bg-amber-500/10 blur-[130px] pointer-events-none -z-10 rounded-full" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 text-xs font-bold">
          <FileSignature className="w-3.5 h-3.5" />
          <span>Proprietary Vector Stamping</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Smart Anchor Cryptographic E-Signatures
        </h2>
        <p className="text-sm sm:text-base text-slate-300">
          Replaces legacy scan-and-paste distortions with intelligent vector anchor placement that mathematically calculates signatory positions without shifting document margins.
        </p>
      </div>

      {/* Split Comparison + Interactive Sandbox */}
      <div className="grid lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Legacy vs SASDMS Comparison */}
        <div className="lg:col-span-6 space-y-6">
          {/* Legacy Warning Card */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-rose-900/40 space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Legacy Manual Paper Workflow (Vulnerabilities)</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Margin misalignment and page dislocation during manual scanning.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Unauthenticated pasted PNG signatures prone to illicit forgery.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Zero timestamp audit lineage or IP address binding.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Physical documents easily misplaced during inter-office transfers.</span>
              </li>
            </ul>
          </div>

          {/* SASDMS Smart Anchor Card */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/40 space-y-3 relative overflow-hidden shadow-xl">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>SASDMS Smart Anchor Engine (Institutional Standard)</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-200">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Automated text-anchor parsing identifies signatory lines in real-time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Cryptographically bound vector strokes stored in secure private vaults.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Philippine RA 10173 compliant audit stamps with reviewer ID & timestamp.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Preserves original document formatting with exact 0px margin drift.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Interactive Sandbox Demonstrator */}
        <div className="lg:col-span-6">
          <div className="glass-panel-dark rounded-3xl p-6 sm:p-7 border border-slate-700 shadow-2xl backdrop-blur-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2">
                <Stamp className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Live Smart Anchor Preview Sandbox
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Anchor Lock: ACTIVE
              </span>
            </div>

            {/* Mode Switcher Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActiveStampMode("stylus")}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                  activeStampMode === "stylus"
                    ? "bg-amber-400 text-slate-950 border-amber-400 shadow-md font-black"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                Vector Stylus
              </button>
              <button
                type="button"
                onClick={() => setActiveStampMode("seal")}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                  activeStampMode === "seal"
                    ? "bg-amber-400 text-slate-950 border-amber-400 shadow-md font-black"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                Official SAS Seal
              </button>
              <button
                type="button"
                onClick={() => setActiveStampMode("director")}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                  activeStampMode === "director"
                    ? "bg-amber-400 text-slate-950 border-amber-400 shadow-md font-black"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                Director Endorsement
              </button>
            </div>

            {/* Interactive Document Signing Canvas Simulation */}
            <div className="p-6 rounded-2xl bg-white text-slate-900 shadow-inner relative overflow-hidden space-y-6">
              {/* Document Header Snippet */}
              <div className="border-b border-slate-200 pb-3">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  FIRST ASIA INSTITUTE OF TECHNOLOGY AND HUMANITIES
                </div>
                <div className="text-xs font-black text-[#0F2962]">
                  STUDENT & ALUMNI SERVICES • OFFICIAL ENDORSEMENT
                </div>
              </div>

              <div className="text-[11px] text-slate-700 leading-relaxed font-serif">
                This certifies that the undersigned has thoroughly reviewed and verified the institutional terms stated herein in full compliance with university guidelines and Philippine Data Privacy Act standards.
              </div>

              {/* Signatory Box with Dynamic Stamp */}
              <div className="pt-4 border-t border-dashed border-slate-300 relative min-h-27.5 flex flex-col justify-end">
                {/* Dynamic Stamp Layer */}
                {activeStampMode === "stylus" && (
                  <div className="absolute top-0 left-6 animate-in fade-in zoom-in-95 duration-200">
                    <svg className="w-44 h-14 text-blue-900 fill-none stroke-current stroke-2" viewBox="0 0 200 60">
                      <path d="M 10 40 Q 30 10, 50 35 T 90 25 T 130 40 Q 150 15, 180 30" strokeLinecap="round" />
                    </svg>
                  </div>
                )}

                {activeStampMode === "seal" && (
                  <div className="absolute -top-2 right-4 w-24 h-24 rounded-full border-2 border-dashed border-amber-700 text-amber-800 flex flex-col items-center justify-center p-2 text-center rotate-6 animate-in fade-in zoom-in-95 duration-200 bg-amber-50/70">
                    <span className="text-[7px] font-black tracking-widest uppercase">FAITH COLLEGES</span>
                    <span className="text-[9px] font-black text-amber-900">SAS SEAL</span>
                    <span className="text-[7px] font-mono">OFFICIAL</span>
                  </div>
                )}

                {activeStampMode === "director" && (
                  <div className="absolute -top-3 left-4 right-4 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                    <svg className="w-36 h-12 text-[#0F2962] fill-none stroke-current stroke-2" viewBox="0 0 200 60">
                      <path d="M 15 35 Q 40 10, 60 30 T 100 20 T 140 38" strokeLinecap="round" />
                    </svg>
                    <div className="w-14 h-14 rounded-lg bg-slate-900 text-amber-400 p-1 flex items-center justify-center border border-slate-800 shadow-md">
                      <QrCode className="w-12 h-12" />
                    </div>
                  </div>
                )}

                {/* Signatory Text Baseline */}
                <div className="pt-6">
                  <div className="text-xs font-black text-slate-950 uppercase tracking-wide">
                    DR. MARIA HELENA TORRES
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    Director, Student & Alumni Services (SAS)
                  </div>
                </div>
              </div>
            </div>

            {/* Micro-Telemetry Footer */}
            <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-400 font-mono">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Anchor Offset:</span>
                <span className="text-slate-200">X: 380pt, Y: 120pt</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Cryptographic Hash:</span>
                <span className="text-emerald-400">RA-10173 Valid</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
