"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Archive,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  Calendar,
  Layers,
} from "lucide-react";
import {
  simulateRetentionDisposalAction,
  RetentionSimulationResult,
} from "@/actions/retention";
import { formatFileSize, formatHumanDate } from "@/lib/status-labels";

export default function AdminRetentionSimulator() {
  const [retentionYears, setRetentionYears] = useState(5);
  const [data, setData] = useState<RetentionSimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runSimulation = useCallback(async (years: number) => {
    setIsLoading(true);
    try {
      const res = await simulateRetentionDisposalAction(years);
      if (res.success && res.result) {
        setData(res.result);
      }
    } catch {
      // Ignore network glitch
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    simulateRetentionDisposalAction(retentionYears).then((res) => {
      if (isMounted && res.success && res.result) {
        setData(res.result);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [retentionYears]);

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/90 bg-white/90 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center font-bold border border-amber-200 shadow-xs">
            <Archive className="w-4.5 h-4.5 text-amber-800" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              Statutory Retention Policy Dry-Run Simulator
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Simulate RA 10173 & CHED statutory retention disposal schedules
            </p>
          </div>
        </div>

        {/* Retention Period Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          {[1, 3, 5, 10].map((years) => (
            <button
              key={years}
              type="button"
              onClick={() => {
                setRetentionYears(years);
                runSimulation(years);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                retentionYears === years
                  ? "bg-amber-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              {years}-Year Cycle
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-700" />
          <span>Simulating retention policy across records...</span>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Summary Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-600" />
                <span>Simulated Cutoff Date</span>
              </span>
              <p className="text-base font-black text-slate-900 font-mono">
                {formatHumanDate(data.cutoffDate)}
              </p>
              <span className="text-[10px] text-slate-500 font-medium block">
                All records prior to this date eligible
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-600" />
                <span>Eligible for Archival</span>
              </span>
              <p className="text-base font-black text-slate-900 font-mono">
                {data.eligibleCount} Document{data.eligibleCount === 1 ? "" : "s"}
              </p>
              <span className="text-[10px] text-amber-800 font-bold block">
                {retentionYears}-year statutory maturity reached
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-emerald-600" />
                <span>Simulated Reclaim</span>
              </span>
              <p className="text-base font-black text-slate-900 font-mono">
                {formatFileSize(data.totalSizeBytes)}
              </p>
              <span className="text-[10px] text-emerald-700 font-bold block">
                Storage archive capacity
              </span>
            </div>
          </div>

          {/* Dry Run Preview Table */}
          {data.previewDocuments.length > 0 ? (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Sample Retention Disposal Candidates</span>
                <span className="font-mono text-[10px] text-slate-400">
                  Showing {data.previewDocuments.length} of {data.eligibleCount}
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {data.previewDocuments.map((doc) => (
                  <div key={doc.id} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-slate-900 text-[11px]">{doc.trackingNumber}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                        {doc.unitCode}
                      </span>
                      <span className="text-slate-600 truncate text-[11px]">{doc.title}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 shrink-0">
                      <span>{formatHumanDate(doc.createdAt)}</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200/60">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
              <p className="font-bold text-slate-700">Zero Unarchived Documents Exceeding {retentionYears}-Year Threshold</p>
              <p className="text-[11px] text-slate-400 mt-0.5">All active repository records remain within compliant retention lifecycle.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
