"use client";

import { useEffect, useState } from "react";
import { AlertOctagon, RotateCcw, Home, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

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
        <div className="p-3 rounded-xl bg-slate-100 text-slate-600 font-mono text-[11px] max-w-sm mx-auto truncate border border-slate-200">
          Digest ID: {error.digest}
        </div>
      )}

      {/* Collapsible Error Message Details */}
      {error.message && (
        <div className="max-w-md mx-auto text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 mx-auto transition cursor-pointer"
          >
            <span>{showDetails ? "Hide Technical Details" : "View Technical Diagnostics"}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <div className="mt-2.5 p-3.5 rounded-2xl bg-slate-900 text-rose-300 font-mono text-[11px] border border-slate-800 wrap-break-word shadow-inner animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold mb-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Exception Trace</span>
              </div>
              <p>{error.message}</p>
            </div>
          )}
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
