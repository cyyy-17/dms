import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import LoginForm from "@/components/LoginForm";
import { MapPin, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="h-screen max-h-screen min-h-screen bg-slate-950 flex flex-col justify-between p-4 sm:p-6 lg:px-8 lg:py-4 relative overflow-hidden selection:bg-amber-400 selection:text-slate-950">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-y-1/2 w-200 h-125 bg-blue-900/20 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-150 h-100 bg-amber-500/10 blur-[130px] pointer-events-none rounded-full" />

      {/* Top Brand Bar / Back Link */}
      <div className="max-w-6xl mx-auto w-full mb-2 sm:mb-3 flex items-center justify-between z-10 shrink-0">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition group py-1.5 px-3 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Institutional Portal</span>
        </Link>

        <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-slate-900/80 border border-slate-800/80 px-3 py-1.5 rounded-xl shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>SSO Gateway Active</span>
        </div>
      </div>

      {/* Main Dual-Column Showcase Container */}
      <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-12 gap-5 lg:gap-8 items-center flex-1 min-h-0 relative z-10 my-auto">
        {/* Left Column: Campus Heritage & Values Banner (Visible on lg screens) */}
        <div className="lg:col-span-6 hidden lg:flex flex-col justify-between h-full max-h-[500px] space-y-3">
          {/* Panoramic Campus Hero Card */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800/90 shadow-xl bg-slate-900 flex-1 min-h-0 flex flex-col justify-between p-5 group">
            {/* Campus Background Image */}
            <Image
              src="/images/faith-campus.jpg"
              alt="First Asia Institute of Technology and Humanities Campus"
              fill
              className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/70 to-slate-950/30" />

            {/* Top Tag on Campus Card */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-white text-[10.5px] font-semibold shadow-xs">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>Tanauan City, Batangas</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[9.5px] font-mono font-bold shadow-xs">
                FAITH Colleges
              </span>
            </div>

            {/* Bottom Inset on Campus Card */}
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/95 p-1 flex items-center justify-center border border-amber-400/50 shadow-md shrink-0">
                  <Image
                    src="/images/faith-crest.png"
                    alt="FAITH Emblem"
                    width={38}
                    height={38}
                    className="w-auto h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-base font-black text-white leading-tight">
                    Student &amp; Alumni Services
                  </h2>
                  <p className="text-[11px] text-amber-300 font-semibold tracking-wide">
                    First Asia Institute of Technology and Humanities
                  </p>
                </div>
              </div>
              <p className="text-[11.5px] text-slate-300 leading-relaxed font-normal">
                Empowering institutional governance with cryptographic document security, unit-scoped tenancy, and sequential multi-signatory approval workflows.
              </p>
            </div>
          </div>

          {/* Institutional Core Values Strip */}
          <div className="grid grid-cols-3 gap-2.5 shrink-0">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/90 text-center space-y-0.5 backdrop-blur-md shadow-xs">
              <span className="text-[11px] font-black text-blue-400 block tracking-wide">Competence</span>
              <span className="text-[9.5px] text-slate-400 font-medium block">Academic Rigor</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/90 text-center space-y-0.5 backdrop-blur-md shadow-xs">
              <span className="text-[11px] font-black text-amber-400 block tracking-wide">Commitment</span>
              <span className="text-[9.5px] text-slate-400 font-medium block">Institutional Trust</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/90 text-center space-y-0.5 backdrop-blur-md shadow-xs">
              <span className="text-[11px] font-black text-emerald-400 block tracking-wide">Compassion</span>
              <span className="text-[9.5px] text-slate-400 font-medium block">Student-First</span>
            </div>
          </div>
        </div>

        {/* Right Column: Secure Employee Login Form */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto lg:max-w-none flex flex-col justify-center">
          <div className="text-center lg:text-left mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-[11px] font-bold mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Institutional Single Sign-On</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Employee Portal Sign In
            </h1>
            <p className="mt-0.5 text-xs text-slate-400 font-medium">
              Access your department queue with your official <code className="text-amber-400 font-mono font-bold">@firstasia.edu.ph</code> credentials.
            </p>
          </div>

          <Suspense fallback={<div className="rounded-2xl p-6 bg-slate-900/85 border border-slate-800 text-center text-slate-400 text-xs font-bold">Loading secure login portal...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>

      {/* Subtle Bottom System Integrity Indicator */}
      <div className="max-w-6xl mx-auto w-full text-center text-[10.5px] text-slate-500 font-mono py-1 shrink-0">
        <span>Zero-Trust Tenancy • RA 10173 Cryptographic Integrity • FAITH SAS</span>
      </div>
    </div>
  );
}
