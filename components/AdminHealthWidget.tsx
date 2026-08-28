"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Database,
  HardDrive,
  Mail,
  RefreshCw,
  Server,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { getSystemDiagnosticsAction, SystemDiagnostics } from "@/actions/diagnostics";

export default function AdminHealthWidget() {
  const [data, setData] = useState<SystemDiagnostics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDiagnostics = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await getSystemDiagnosticsAction();
      if (res.success && res.diagnostics) {
        setData(res.diagnostics);
      }
    } catch {
      // Ignore network glitch
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getSystemDiagnosticsAction().then((res) => {
      if (!isMounted) return;
      if (res.success && res.diagnostics) {
        setData(res.diagnostics);
      }
      setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/90 bg-white/90 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0F2962] flex items-center justify-center font-bold border border-blue-100 shadow-xs">
            <Activity className="w-4 h-4 text-[#0F2962]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">System Telemetry & Health</h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Real-time SASDMS infrastructure and worker status
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchDiagnostics}
          disabled={isRefreshing}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
          title="Refresh Diagnostic Telemetry"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#0F2962]" : ""}`} />
          <span className="hidden sm:inline">Ping Health</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#0F2962]" />
          <span>Polling subsystem diagnostic endpoints...</span>
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Database */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Database className="w-3 h-3 text-blue-600" />
                <span>PostgreSQL DB</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black font-mono text-slate-900">{data.dbLatencyMs}ms</span>
              <span className="text-[10px] font-bold text-emerald-700">Latency</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-medium">
              Pool Status: <strong className="text-slate-700">{data.dbStatus}</strong>
            </span>
          </div>

          {/* Storage Vault */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-purple-600" />
                <span>Storage Vault</span>
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black font-mono text-slate-900">{data.totalDocuments}</span>
              <span className="text-[10px] font-bold text-purple-700">Files</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-medium">
              Supabase Private Bucket: <strong className="text-emerald-700">Online</strong>
            </span>
          </div>

          {/* Notification Queue */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3 h-3 text-amber-600" />
                <span>Notification Queue</span>
              </span>
              {data.failedNotifications > 0 ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black font-mono text-slate-900">{data.pendingNotifications}</span>
              <span className="text-[10px] font-bold text-amber-700">Pending</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-medium">
              Failed Attempts: <strong className={data.failedNotifications > 0 ? "text-rose-600 font-bold" : "text-slate-700"}>{data.failedNotifications}</strong>
            </span>
          </div>

          {/* Process Memory & Uptime */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Server className="w-3 h-3 text-teal-600" />
                <span>Node Process</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-bold">RSS</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black font-mono text-slate-900">{data.memoryUsageMb} MB</span>
              <span className="text-[10px] font-bold text-teal-700">RAM</span>
            </div>
            <span className="text-[10px] text-slate-400 block font-medium">
              Registered Users: <strong className="text-slate-700">{data.totalUsers}</strong>
            </span>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-xs text-slate-400">
          Telemetry unavailable.
        </div>
      )}
    </div>
  );
}
