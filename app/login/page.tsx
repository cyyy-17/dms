import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import LoginForm from "@/components/LoginForm";
import { MapPin, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-amber-400 selection:text-slate-950">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-y-1/2 w-200 h-125 bg-blue-900/20 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-150 h-100 bg-amber-500/10 blur-[130px] pointer-events-none rounded-full" />

      {/* Top Brand Bar / Back Link */}
      <div className="max-w-6xl mx-auto w-full mb-6 flex items-center justify-between z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition group py-1.5 px-3 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Institutional Portal</span>
        </Link>

        <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-slate-900/80 border border-slate-800/80 px-3 py-1.5 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>SSO Gateway Active</span>
        </div>
      </div>

      {/* Main Dual-Column Showcase Container */}
      <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Column: Campus Heritage & Values Banner (Visible on lg screens) */}
        <div className="lg:col-span-6 flex flex-col justify-between h-full space-y-6">
          {/* Panoramic Campus Hero Card */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-900 min-h-75 sm:min-h-90 flex flex-col justify-between p-6 sm:p-8 group">
            {/* Campus Background Image */}
            <Image
              src="/images/faith-campus.jpg"
              alt="First Asia Institute of Technology and Humanities Campus"
              fill
              className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />

            {/* Top Tag on Campus Card */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700 text-white text-[11px] font-semibold">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>Tanauan City, Batangas</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-mono font-bold">
                FAITH Colleges
              </span>
            </div>

            {/* Bottom Inset on Campus Card */}
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/95 p-1.5 flex items-center justify-center border border-amber-400/50 shadow-lg shrink-0">
                  <Image
                    src="/images/faith-crest.png"
                    alt="FAITH Emblem"
                    width={40}
                    height={40}
                    className="w-auto h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white leading-tight">
                    Student & Alumni Services
                  </h2>
                  <p className="text-xs text-amber-300 font-medium">
                    First Asia Institute of Technology and Humanities
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal pt-1">
                Empowering institutional governance with cryptographic document security, unit-scoped tenancy, and sequential multi-signatory approval workflows.
              </p>
            </div>
          </div>

          {/* Institutional Core Values Strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1 backdrop-blur-md">
              <span className="text-xs font-black text-blue-400 block">Competence</span>
              <span className="text-[10px] text-slate-400 font-medium block">Academic Rigor</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1 backdrop-blur-md">
              <span className="text-xs font-black text-amber-400 block">Commitment</span>
              <span className="text-[10px] text-slate-400 font-medium block">Institutional Trust</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1 backdrop-blur-md">
              <span className="text-xs font-black text-emerald-400 block">Compassion</span>
              <span className="text-[10px] text-slate-400 font-medium block">Student-First</span>
            </div>
          </div>
        </div>

        {/* Right Column: Secure Employee Login Form */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto lg:max-w-none">
          <div className="text-center lg:text-left mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Employee Portal Sign In
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 font-medium">
              Access your department queue with your official <code className="text-amber-400 font-mono font-bold">@firstasia.edu.ph</code> credentials.
            </p>
          </div>

          <Suspense fallback={<div className="glass-panel rounded-3xl p-10 text-center text-slate-400 text-xs font-bold">Loading secure login portal...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
