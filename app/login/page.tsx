import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-amber-400 selection:text-slate-950">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-112.5 bg-linear-to-tr from-blue-900/40 via-indigo-900/30 to-amber-500/15 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-blue-950/40 blur-[130px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <Link href="/" className="inline-flex items-center space-x-2 group">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#0F2962] to-[#1E40AF] flex items-center justify-center text-amber-400 font-black text-2xl shadow-xl shadow-blue-950/70 border border-blue-400/30 group-hover:scale-105 transition-all duration-300">
            FA
          </div>
        </Link>
        <h1 className="mt-5 text-3xl font-black text-white tracking-tight">
          SASDMS Employee Login
        </h1>
        <p className="mt-1.5 text-xs text-slate-400 font-medium">
          Student & Alumni Services • First Asia Institute of Technology and Humanities
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10">
        <Suspense fallback={<div className="glass-panel rounded-3xl p-10 text-center text-slate-400 text-xs font-bold">Loading secure login portal...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
