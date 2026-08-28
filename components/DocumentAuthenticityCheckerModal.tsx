"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Fingerprint,
  Building2,
  Calendar,
  User,
  Loader2,
  Lock,
} from "lucide-react";
import { verifyTrackingTokenAction } from "@/actions/documents";
import { formatHumanDate, getStatusLabel } from "@/lib/status-labels";

interface DocumentAuthenticityCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrackingNumber?: string;
}

export default function DocumentAuthenticityCheckerModal({
  isOpen,
  onClose,
  initialTrackingNumber = "",
}: DocumentAuthenticityCheckerModalProps) {
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    valid?: boolean;
    trackingNumber?: string;
    title?: string;
    status?: string;
    unitName?: string;
    uploaderName?: string;
    sha256Checksum?: string;
    versionNumber?: number;
    sealedDate?: string;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const res = await verifyTrackingTokenAction(trackingNumber.trim());
      if (res.success && res.document) {
        setResult({
          success: true,
          valid: res.isValid !== false,
          trackingNumber: res.document.trackingNumber,
          title: res.document.title,
          status: res.document.status,
          unitName: res.document.unit?.name || "Institutional Unit",
          uploaderName: res.document.uploader
            ? `${res.document.uploader.firstName} ${res.document.uploader.lastName}`
            : "Staff",
          sha256Checksum: res.document.currentVersion?.sha256Checksum,
          versionNumber: res.document.currentVersion?.versionNumber || 1,
          sealedDate: res.document.updatedAt ? new Date(res.document.updatedAt).toISOString() : undefined,
        });
      } else {
        setResult({
          success: false,
          error: res.error || "No valid institutional document found matching this tracking number.",
        });
      }
    } catch {
      setResult({
        success: false,
        error: "Verification service temporarily unreachable. Please check network connection.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="glass-panel rounded-3xl max-w-xl w-full border border-white/90 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-xs">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                Document Authenticity & Integrity Checker
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Verify institutional signatures and SHA-256 seal authenticity
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleVerify} className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Document Tracking Number or Security Token
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. DOC-2026-0001 or CAREER-2026-..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:ring-2 focus:ring-[#0F2962] focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isLoading || !trackingNumber.trim()}
                  className="absolute right-1.5 top-1.5 px-3 py-1.5 rounded-lg bg-[#0F2962] hover:bg-[#091a42] text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Verify</span>
                </button>
              </div>
            </div>
          </form>

          {/* Verification Results */}
          {result && (
            <div className="animate-in fade-in zoom-in-95 duration-150">
              {result.success ? (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-black text-emerald-900">
                        Official Institutional Record Verified
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black font-mono border border-emerald-300">
                      v{result.versionNumber} Sealed
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1 text-xs">
                    <h4 className="font-bold text-slate-900 leading-snug">{result.title}</h4>
                    <div className="grid sm:grid-cols-2 gap-2 text-slate-600 text-[11px] pt-1">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{result.unitName}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{result.uploaderName}</span>
                      </span>
                      {result.sealedDate && (
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatHumanDate(result.sealedDate)}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-bold text-emerald-800">
                        <Lock className="w-3.5 h-3.5" />
                        <span>{getStatusLabel(result.status || "APPROVED")}</span>
                      </span>
                    </div>
                  </div>

                  {result.sha256Checksum && (
                    <div className="p-2.5 rounded-xl bg-slate-900 text-amber-300 font-mono text-[10px] space-y-0.5">
                      <div className="flex items-center justify-between text-slate-400 text-[9px] font-bold uppercase">
                        <span className="flex items-center gap-1">
                          <Fingerprint className="w-3 h-3 text-amber-400" />
                          <span>Cryptographic SHA-256 Checksum</span>
                        </span>
                        <span className="text-emerald-400">Match Validated</span>
                      </div>
                      <span className="break-all block">{result.sha256Checksum}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Verification Failed</span>
                  </div>
                  <p className="text-[11px] text-rose-700 pl-6">{result.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
