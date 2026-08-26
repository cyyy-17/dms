import Link from "next/link";
import { Clock, ShieldCheck, Mail, ArrowLeft } from "lucide-react";

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-amber-400 selection:text-slate-950">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-162.5 h-100 bg-linear-to-tr from-amber-500/20 via-blue-900/30 to-indigo-900/20 blur-[130px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0 relative z-10">
        <div className="glass-panel rounded-3xl py-10 px-7 sm:px-11 shadow-2xl border border-white/80 backdrop-blur-2xl text-center space-y-7 transition-all duration-300">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-2xl bg-amber-400/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-2xl bg-linear-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-xl shadow-amber-500/30 border border-amber-300/40">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300/60 text-xs font-bold">
              <span>Status: Pending Review</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Registration Under Review
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              Your staff registration has been submitted and is currently awaiting administrator review and role assignment.
            </p>
          </div>

          {/* 📊 Account Activation Multi-Stage Progress Stepper */}
          <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Activation Pipeline</span>
              <span className="font-mono text-amber-800">Stage 2 of 3 (50%)</span>
            </div>

            {/* Progress Track */}
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div
                className="h-full rounded-full bg-linear-to-r from-emerald-500 via-amber-400 to-amber-500 animate-pulse transition-all duration-500 shadow-sm"
                style={{ width: "50%" }}
              />
            </div>

            {/* 3 Step Nodes */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
              <div className="text-left font-bold text-emerald-800">
                <span className="block text-[10px] text-emerald-600 font-normal">Step 1</span>
                <span>✓ Submitted</span>
              </div>
              <div className="text-center font-bold text-amber-900">
                <span className="block text-[10px] text-amber-600 font-normal">Step 2</span>
                <span>⏳ Admin Review</span>
              </div>
              <div className="text-right font-bold text-slate-400">
                <span className="block text-[10px] text-slate-400 font-normal">Step 3</span>
                <span>🔒 Unlocked</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 text-left space-y-3.5 text-xs text-slate-600 shadow-inner">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="leading-relaxed">
                <span className="font-bold text-slate-900 block mb-0.5">Admin Activation Required</span>
                Internal compliance mandates explicit administrator verification before document portal access is unlocked.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                <Mail className="w-4 h-4" />
              </div>
              <div className="leading-relaxed">
                <span className="font-bold text-slate-900 block mb-0.5">Automated Notification</span>
                You will receive an official confirmation email once your account has been reviewed and activated.
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white font-bold text-sm shadow-lg shadow-blue-950/20 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2.5 hover:-translate-y-0.5 active:scale-98"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Return to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
