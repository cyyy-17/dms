"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Building2,
} from "lucide-react";
import {
  getApprovalVelocityAction,
  ApprovalVelocityReport,
} from "@/actions/velocity";
import AnimatedCounter from "@/components/AnimatedCounter";

export default function ApprovalVelocityWidget() {
  const [report, setReport] = useState<ApprovalVelocityReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVelocity = async () => {
    setIsLoading(true);
    try {
      const res = await getApprovalVelocityAction();
      if (res.success && res.report) {
        setReport(res.report);
      }
    } catch {
      // Ignore network glitch
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getApprovalVelocityAction().then((res) => {
      if (isMounted) {
        if (res.success && res.report) {
          setReport(res.report);
        }
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="glass-panel rounded-3xl p-6 border border-white/90 bg-white shadow-xs text-center py-8">
        <RefreshCw className="w-5 h-5 animate-spin text-[#0F2962] mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-medium">Calculating unit approval velocity telemetry...</p>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/90 bg-white/90 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#0F2962] flex items-center justify-center font-bold border border-blue-100 shadow-xs">
            <TrendingUp className="w-4.5 h-4.5 text-[#0F2962]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              Unit Approval Velocity & Bottleneck Telemetry
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Average review turnaround times from submission to final executive seal
            </p>
          </div>
        </div>

        <button
          onClick={fetchVelocity}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          title="Refresh Velocity Telemetry"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Overall Turnaround</span>
          </span>
          <p className="text-xl font-black text-slate-900 font-mono">
            <AnimatedCounter value={report.overallAvgHours} decimals={1} suffix=" Hours" />
          </p>
          <span className="text-[10px] text-slate-500 font-medium block">
            Across <AnimatedCounter value={report.totalApprovedDocs} suffix=" sealed documents" />
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>Fastest Turnaround</span>
          </span>
          <p className="text-xl font-black text-emerald-900 font-mono">
            {report.fastestUnit}
          </p>
          <span className="text-[10px] text-emerald-700 font-bold block">
            Highest review velocity
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Turnaround Bottleneck</span>
          </span>
          <p className="text-xl font-black text-amber-900 font-mono">
            {report.slowestUnit}
          </p>
          <span className="text-[10px] text-amber-700 font-bold block">
            Requires process optimization
          </span>
        </div>
      </div>

      {/* Unit Breakdown Matrix */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
          <span>Institutional Unit Breakdown</span>
          <span>Turnaround Speed</span>
        </div>
        <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
          {report.unitMetrics.map((unit) => (
            <div key={unit.unitCode} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-900">{unit.unitName}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-600">
                  {unit.unitCode}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-slate-700 text-[11px]">
                  {unit.avgTurnaroundHours > 0 ? `${unit.avgTurnaroundHours}h avg` : "No Data"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                    unit.rating === "FAST"
                      ? "bg-emerald-100 text-emerald-800"
                      : unit.rating === "MODERATE"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {unit.rating === "FAST" ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  ) : unit.rating === "MODERATE" ? (
                    <Clock className="w-3 h-3 text-blue-600" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                  )}
                  <span>{unit.rating}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
