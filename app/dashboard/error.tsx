"use client";

import { useEffect } from "react";
import { AlertOctagon, RotateCcw, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception to console / client monitoring
    console.error("[DASHBOARD_RUNTIME_ERROR]", error);
  }, [error]);

  return (
    <div className="p-6 lg:p-12 max-w-2xl mx-auto w-full text-center space-y-6 animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-inner border border-rose-200">
        <AlertOctagon className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
          Runtime Exception Boundary
        </span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          An Unexpected Error Occurred
        </h1>
        <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
          The system encountered an unhandled exception while rendering this dashboard view. Your session data and document audit lineage remain securely preserved.
        </p>
      </div>

      {error.digest && (
        <div className="p-3 rounded-xl bg-slate-100 text-slate-500 font-mono text-[10px] max-w-sm mx-auto truncate border border-slate-200">
          Digest ID: {error.digest}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F2962] text-white text-xs font-bold shadow-md hover:bg-[#091a42] transition cursor-pointer hover:-translate-y-0.5 active:scale-98"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>Retry Operation</span>
        </button>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold shadow-xs hover:bg-slate-50 transition cursor-pointer hover:-translate-y-0.5"
        >
          <Home className="w-4 h-4 text-slate-500" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
