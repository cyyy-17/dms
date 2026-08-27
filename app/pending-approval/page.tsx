import Link from "next/link";
import Image from "next/image";
import { Clock, ShieldCheck, Mail, ArrowLeft } from "lucide-react";

export default function PendingApprovalPage() {
  return (
    <div className="h-screen max-h-screen min-h-screen bg-slate-950 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-amber-400 selection:text-slate-950">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-162.5 h-100 bg-linear-to-tr from-amber-500/20 via-blue-900/30 to-indigo-900/20 blur-[130px] pointer-events-none rounded-full" />

      {/* Top Brand Tag */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg flex items-center justify-between z-10 shrink-0">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition group py-1.5 px-3 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Institutional Portal</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0 relative z-10 my-auto">
        <div className="rounded-2xl sm:rounded-3xl py-6 px-5 sm:py-7 sm:px-8 shadow-2xl bg-slate-900/85 border border-slate-800/90 backdrop-blur-2xl text-center space-y-4 transition-all duration-300">
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/95 p-1 flex items-center justify-center border border-amber-400/50 shadow-md">
              <Image
                src="/images/faith-crest.png"
                alt="FAITH Colleges Crest"
                width={32}
                height={32}
                className="w-auto h-full object-contain"
              />
            </div>
            <div className="text-left">
              <span className="text-xs font-black text-white block">FAITH Colleges</span>
              <span className="text-[11px] text-amber-300 font-medium">Student &amp; Alumni Services</span>
            </div>
          </div>

          <div className="relative mx-auto w-12 h-12">
            <div className="absolute inset-0 rounded-xl bg-amber-400/20 animate-ping" />
            <div className="relative w-12 h-12 rounded-xl bg-linear-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-300/40">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30 text-[11px] font-bold">
              <span>Status: Pending Administrator Review</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Registration Under Review
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              Your staff registration has been submitted and is currently awaiting administrator review and role assignment by FAITH SAS Administration.
            </p>
          </div>

          {/* 📊 Account Activation Multi-Stage Progress Stepper */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span>Activation Pipeline</span>
              <span className="font-mono text-amber-400">Stage 2 of 3 (50%)</span>
            </div>

            {/* Progress Track */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div
                className="h-full rounded-full bg-linear-to-r from-emerald-500 via-amber-400 to-amber-500 animate-pulse transition-all duration-500 shadow-sm"
                style={{ width: "50%" }}
              />
            </div>

            {/* 3 Step Nodes */}
            <div className="grid grid-cols-3 gap-2 pt-0.5 text-[10.5px]">
              <div className="text-left font-bold text-emerald-400">
                <span className="block text-[9.5px] text-emerald-500 font-normal">Step 1</span>
                <span>✓ Submitted</span>
              </div>
              <div className="text-center font-bold text-amber-400">
                <span className="block text-[9.5px] text-amber-500 font-normal">Step 2</span>
                <span>⏳ Admin Review</span>
              </div>
              <div className="text-right font-bold text-slate-500">
                <span className="block text-[9.5px] text-slate-500 font-normal">Step 3</span>
                <span>🔒 Unlocked</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 text-left space-y-2 text-xs text-slate-400 shadow-inner">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="leading-tight text-[11.5px]">
                <span className="font-bold text-white block mb-0.5">Admin Activation Required</span>
                Internal compliance mandates explicit administrator verification before document portal access is unlocked.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <div className="leading-tight text-[11.5px]">
                <span className="font-bold text-white block mb-0.5">Automated Notification</span>
                You will receive an official confirmation email once your account has been reviewed and activated.
              </div>
            </div>
          </div>

          <div className="pt-1">
            <Link
              href="/login"
              className="w-full py-2.5 px-4 rounded-xl bg-linear-to-r from-blue-700 via-[#0F2962] to-blue-800 hover:from-blue-600 hover:to-blue-700 text-white font-black text-xs shadow-lg shadow-blue-950/40 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-98 ring-1 ring-blue-400/40"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Return to Sign In</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center text-[10.5px] text-slate-500 font-mono py-1 shrink-0">
        <span>Zero-Trust Tenancy • FAITH SAS</span>
      </div>
    </div>
  );
}
