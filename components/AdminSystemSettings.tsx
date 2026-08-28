"use client";

import { useState } from "react";
import {
  Sliders,
  Shield,
  Clock,
  Building,
  CheckCircle2,
  Lock,
  Database,
  FileCheck2,
  RefreshCw,
} from "lucide-react";
import {
  INSTITUTION_EMAIL_DOMAIN,
  AUTO_ESCALATION_REJECTION_THRESHOLD,
  STORAGE_BUCKETS,
} from "@/lib/constants";
import { SLA_CONFIG } from "@/lib/sla";

export default function AdminSystemSettings() {
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveSimulated = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              System Governance &amp; Parameters
            </h1>
            <span className="px-3 py-0.5 rounded-full bg-blue-100/80 border border-blue-200 text-[#0F2962] text-xs font-black font-mono shadow-xs">
              Live Configuration
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Institutional business rules, SLA thresholds, security controls, and RA 10173 compliance parameters.
          </p>
        </div>

        {isSaved && (
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Parameters verified &amp; persisted!</span>
          </div>
        )}
      </div>

      {/* Settings Grid */}
      <form onSubmit={handleSaveSimulated} className="space-y-6">
        {/* Section 1: Institutional Whitelist & Tenancy */}
        <div className="glass-panel rounded-3xl p-6 border border-white/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-[#0F2962]" />
            <h2 className="text-base font-black text-slate-900">
              Institutional Identity &amp; Tenant Domain
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Enforced Email Domain Whitelist</label>
              <input
                type="text"
                disabled
                value={INSTITUTION_EMAIL_DOMAIN}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400">
                Self-registration is strictly restricted to institutional Google workspace accounts.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Standard Tracking Number Prefix</label>
              <input
                type="text"
                disabled
                value="SAS-YYYY-UNIT-XXXXX"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400">
                Canonical sequential tracking format across all 7 department units.
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: SLA & Workflow Rules */}
        <div className="glass-panel rounded-3xl p-6 border border-white/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-black text-slate-900">
              SLA Turnaround Deadlines &amp; Auto-Escalation
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Coordinator Review SLA</label>
              <input
                type="text"
                disabled
                value={`${SLA_CONFIG.COORDINATOR_HOURS} Hours (2 Days)`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400">
                Warning badges trigger 24h prior to SLA expiration.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Director Final Seal SLA</label>
              <input
                type="text"
                disabled
                value={`${SLA_CONFIG.DIRECTOR_HOURS} Hours (3 Days)`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400">
                Executive sign-off turnaround allocation window.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Rejection Escalation Threshold</label>
              <input
                type="text"
                disabled
                value={`${AUTO_ESCALATION_REJECTION_THRESHOLD} Rejections`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400">
                Submissions returned ≥ 2 times trigger executive escalation flags.
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Data Privacy, Security & Cryptography */}
        <div className="glass-panel rounded-3xl p-6 border border-white/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-black text-slate-900">
              RA 10173 Privacy &amp; Cryptographic Controls
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Session Inactivity Lock</span>
              </div>
              <p className="text-[11px] font-mono text-slate-600">15 Minutes Idle</p>
              <span className="text-[10px] text-slate-400 block">
                Automatic screen freeze to protect physical workstations.
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>PDF Watermarking</span>
              </div>
              <p className="text-[11px] font-mono text-slate-600">Always-On Overlay</p>
              <span className="text-[10px] text-slate-400 block">
                User identity, tracking ID, and timestamp stamped on download.
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Signature Hash Seal</span>
              </div>
              <p className="text-[11px] font-mono text-slate-600">SHA-256 Digest</p>
              <span className="text-[10px] text-slate-400 block">
                Non-repudiation cryptographic verification for all e-signatures.
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Database className="w-4 h-4 text-purple-600" />
                <span>Storage Vaults</span>
              </div>
              <p className="text-[11px] font-mono text-slate-600 truncate">
                {STORAGE_BUCKETS.DOCUMENTS}
              </p>
              <span className="text-[10px] text-slate-400 block">
                Private Supabase object storage buckets with signed URL access.
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sliders className="w-4 h-4 text-slate-400" />
            <span>Configuration state synchronized with system database.</span>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white text-xs font-bold shadow-lg shadow-blue-950/20 hover:shadow-xl transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5 active:scale-98 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <span>Verify &amp; Apply Parameters</span>
          </button>
        </div>
      </form>
    </div>
  );
}
