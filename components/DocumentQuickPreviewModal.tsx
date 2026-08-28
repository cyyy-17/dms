"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  ExternalLink,
  X,
  Copy,
  Check,
  Tag,
} from "lucide-react";
import { DocumentStatus } from "@prisma/client";
import { formatHumanDate, getStatusLabel, getStatusBadgeClass } from "@/lib/status-labels";

export interface QuickPreviewDoc {
  id: string;
  trackingNumber: string;
  title: string;
  status: DocumentStatus;
  createdAt: Date | string;
  expiryDate?: Date | string | null;
  unit: { code: string; name: string };
  documentType: { name: string; code?: string };
  uploader: { firstName: string; lastName: string; email?: string };
  currentVersion?: {
    versionNumber: number;
    fileName: string;
    sha256Checksum: string;
  } | null;
}

export default function DocumentQuickPreviewModal({
  isOpen,
  onClose,
  document,
}: {
  isOpen: boolean;
  onClose: () => void;
  document: QuickPreviewDoc | null;
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !document) return null;

  const handleCopyChecksum = () => {
    if (!document.currentVersion?.sha256Checksum) return;
    navigator.clipboard.writeText(document.currentVersion.sha256Checksum);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-xl rounded-3xl bg-white border border-white/90 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0F2962] flex items-center justify-center font-bold border border-blue-100 shadow-xs shrink-0 mt-0.5">
              <FileText className="w-5 h-5 text-[#0F2962]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-[#0F2962] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  {document.trackingNumber}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-2xs ${getStatusBadgeClass(
                    document.status
                  )}`}
                >
                  {getStatusLabel(document.status)}
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 leading-snug">
                {document.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-blue-600" />
              <span>Unit Tenancy</span>
            </span>
            <p className="font-bold text-slate-900 truncate">{document.unit.name}</p>
            <span className="text-[10px] font-mono text-slate-500 font-bold">
              {document.unit.code}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Tag className="w-3 h-3 text-purple-600" />
              <span>Classification</span>
            </span>
            <p className="font-bold text-slate-900 truncate">{document.documentType.name}</p>
            <span className="text-[10px] font-mono text-slate-500 font-bold">
              v{document.currentVersion?.versionNumber || 1}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <User className="w-3 h-3 text-emerald-600" />
              <span>Ingested By</span>
            </span>
            <p className="font-bold text-slate-900 truncate">
              {document.uploader.firstName} {document.uploader.lastName}
            </p>
            <span className="text-[10px] text-slate-500 truncate block">
              {document.uploader.email}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-600" />
              <span>Timeline Dates</span>
            </span>
            <p className="font-bold text-slate-900">
              {formatHumanDate(document.createdAt)}
            </p>
            <span className="text-[10px] text-slate-500 block">
              {document.expiryDate ? `Expires: ${formatHumanDate(document.expiryDate)}` : "No expiry date"}
            </span>
          </div>
        </div>

        {/* SHA-256 Checksum Block */}
        {document.currentVersion?.sha256Checksum && (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>SHA-256 Checksum Seal</span>
              </span>
              <button
                type="button"
                onClick={handleCopyChecksum}
                className="text-[#0F2962] hover:text-blue-700 flex items-center gap-1 font-bold cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <code className="text-[10px] font-mono text-slate-700 break-all block bg-white p-2 rounded-xl border border-slate-200 select-all">
              {document.currentVersion.sha256Checksum}
            </code>
          </div>
        )}

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Close Preview
          </button>

          <Link
            href={`/dashboard/documents/${document.id}`}
            className="px-4 py-2 text-xs font-bold bg-[#0F2962] hover:bg-[#091a42] text-white rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Full Record</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
