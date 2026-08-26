"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Lock } from "lucide-react";

export default function LandingCtaSection() {
  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-87.5 bg-amber-500/10 blur-[140px] pointer-events-none -z-10 rounded-full" />

      <div className="glass-panel-dark rounded-3xl p-8 sm:p-14 border border-blue-500/30 text-center space-y-7 relative overflow-hidden shadow-2xl backdrop-blur-2xl">
        {/* Animated Radiant Mesh Gradient Background */}
        <div className="absolute inset-0 bg-linear-to-r from-blue-900/30 via-indigo-900/25 to-amber-500/15 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Central Emblem Badge */}
        <div className="relative z-10 mx-auto w-16 h-16 rounded-3xl bg-linear-to-br from-[#0F2962] to-[#1E40AF] border border-blue-400/40 text-amber-400 font-black text-2xl flex items-center justify-center shadow-xl shadow-blue-950/80">
          FA
        </div>

        <div className="relative z-10 max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Ready to Sign or Process SAS Documents?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Sign in with your authorized FAITH Colleges account to manage your review queue, endorse department proposals, or inspect real-time audit logs.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap justify-center items-center gap-4 pt-2">
          <Link
            href="/login"
            className="px-8 py-4 rounded-2xl bg-linear-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-400/20 hover:shadow-amber-400/40 transition-all duration-200 flex items-center gap-2 transform active:scale-95 cursor-pointer"
          >
            <span>Sign In to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/register"
            className="px-7 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-white font-bold text-sm shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
          >
            Apply for Staff Registration
          </Link>
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 pt-3 border-t border-slate-800/80">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>@firstasia.edu.ph Institutional Auth</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>RA 10173 Privacy Certified</span>
          </span>
          <span>•</span>
          <span>Encrypted TLS 1.3 Private Storage</span>
        </div>
      </div>
    </section>
  );
}
