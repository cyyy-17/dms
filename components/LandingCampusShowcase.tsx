"use client";

import Image from "next/image";
import {
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function LandingCampusShowcase() {
  const coreValues = [
    {
      title: "Competence",
      desc: "Championing technological excellence, modern research, and uncompromising precision across institutional processes.",
      color: "from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/30",
      accent: "text-blue-400",
      bgBadge: "bg-blue-950/60 text-blue-300 border-blue-500/30",
    },
    {
      title: "Commitment",
      desc: "Upholding student trust, transparent governance, sequential accountability, and dedicated community service.",
      color: "from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/30",
      accent: "text-amber-400",
      bgBadge: "bg-amber-950/60 text-amber-300 border-amber-500/30",
    },
    {
      title: "Compassion",
      desc: "Delivering empathetic, student-first support services, counseling guidance, and accessible financial assistance.",
      color: "from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30",
      accent: "text-emerald-400",
      bgBadge: "bg-emerald-950/60 text-emerald-300 border-emerald-500/30",
    },
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-160 h-120 bg-blue-900/15 blur-[140px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute bottom-10 right-1/4 w-140 h-100 bg-amber-500/10 blur-[130px] pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Institutional Heritage & Campus</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            First Asia Institute of Technology and Humanities
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Rooted in Batangas with a panoramic view of Mount Makiling, FAITH Colleges is a pioneer in progressive education, technology integration, and holistic human development.
          </p>
        </div>

        {/* Panoramic Campus Hero Card with Glass Overlay */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl shadow-black/80 bg-slate-900 group">
          {/* Main Campus Image */}
          <div className="relative w-full h-80 sm:h-110 lg:h-125 overflow-hidden">
            <Image
              src="/images/faith-campus.jpg"
              alt="First Asia Institute of Technology and Humanities Campus with Mount Makiling"
              fill
              className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
            />

            {/* Gradient Overlays for Readability */}
            <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute inset-0 bg-linear-to-r from-slate-950/70 via-transparent to-slate-950/40" />

            {/* Top Floating Telemetry Badges */}
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex flex-wrap items-center gap-2.5 z-10">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-white text-xs font-semibold shadow-lg">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Tanauan City, Batangas, PH</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified SAS Infrastructure</span>
              </div>
            </div>

            {/* Bottom Content Inset */}
            <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-8 z-10">
              <div className="glass-panel-dark rounded-2xl p-5 sm:p-7 border border-white/10 backdrop-blur-xl max-w-2xl space-y-3 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/95 p-1 flex items-center justify-center border border-amber-400/50 shadow-md shrink-0">
                    <Image
                      src="/images/faith-crest.png"
                      alt="FAITH Seal"
                      width={36}
                      height={36}
                      className="w-auto h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                      Student & Alumni Services (SAS)
                    </h3>
                    <p className="text-xs text-amber-400 font-semibold font-mono">
                      Institutional Document Management System
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  FAITH Colleges provides comprehensive academic and co-curricular ecosystems spanning basic education, collegiate departments, and post-graduate institutes. SASDMS unifies all departmental document lifecycles with enterprise-grade governance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Core Pillars: Competence • Commitment • Compassion */}
        <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
          {coreValues.map((pillar) => (
            <div
              key={pillar.title}
              className="glass-panel-dark rounded-3xl p-6 sm:p-7 border border-slate-800/80 hover:border-slate-700 transition-all duration-200 hover:-translate-y-1 relative overflow-hidden group space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-full border ${pillar.bgBadge}`}>
                  Core Institutional Value
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </div>

              <h3 className={`text-xl font-black ${pillar.accent}`}>
                {pillar.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
