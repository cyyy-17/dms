"use client";

import { useState } from "react";
import {
  GitCompare,
  X,
  FileText,
  Fingerprint,
  Calendar,
  User,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
} from "lucide-react";
import { formatFileSize, formatHumanDateTime } from "@/lib/status-labels";

interface VersionItem {
  id: string;
  versionNumber: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  sha256Checksum: string;
  storagePath: string;
  changeSummary: string | null;
  createdAt: Date;
  uploadedBy?: { firstName: string; lastName: string } | null;
}

interface DocumentVersionDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: VersionItem[];
  trackingNumber: string;
}

export default function DocumentVersionDiffModal({
  isOpen,
  onClose,
  versions,
  trackingNumber,
}: DocumentVersionDiffModalProps) {
  const sortedVersions = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);

  const [leftVerNum, setLeftVerNum] = useState<number>(
    sortedVersions.length > 1 ? sortedVersions[sortedVersions.length - 2].versionNumber : sortedVersions[0]?.versionNumber || 1
  );
  const [rightVerNum, setRightVerNum] = useState<number>(
    sortedVersions[sortedVersions.length - 1]?.versionNumber || 1
  );

  if (!isOpen || sortedVersions.length === 0) return null;

  const leftVer = sortedVersions.find((v) => v.versionNumber === leftVerNum) || sortedVersions[0];
  const rightVer = sortedVersions.find((v) => v.versionNumber === rightVerNum) || sortedVersions[sortedVersions.length - 1];

  const sizeDelta = rightVer.fileSize - leftVer.fileSize;
  const isDifferentFiles = leftVer.id !== rightVer.id;
  const isHashIdentical = leftVer.sha256Checksum === rightVer.sha256Checksum;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="glass-panel rounded-3xl max-w-4xl w-full border border-white/90 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0F2962] flex items-center justify-center border border-blue-100 shadow-xs">
              <GitCompare className="w-4 h-4 text-[#0F2962]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Version Diff & Changelog Inspector</span>
                <span className="font-mono text-xs font-semibold text-slate-500">[{trackingNumber}]</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Side-by-side metadata and cryptographic integrity comparison
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

        {/* Version Pickers */}
        <div className="p-4 sm:px-6 bg-slate-100/70 border-b border-slate-200/80 grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Base Version (Left)
            </label>
            <select
              value={leftVerNum}
              onChange={(e) => setLeftVerNum(Number(e.target.value))}
              className="w-full text-xs font-bold py-2 px-3 rounded-xl border border-slate-300 bg-white text-slate-900 shadow-xs focus:ring-2 focus:ring-[#0F2962] focus:outline-none"
            >
              {sortedVersions.map((v) => (
                <option key={v.id} value={v.versionNumber}>
                  v{v.versionNumber} — {v.fileName} ({formatFileSize(v.fileSize)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Target Version (Right)
            </label>
            <select
              value={rightVerNum}
              onChange={(e) => setRightVerNum(Number(e.target.value))}
              className="w-full text-xs font-bold py-2 px-3 rounded-xl border border-slate-300 bg-white text-slate-900 shadow-xs focus:ring-2 focus:ring-[#0F2962] focus:outline-none"
            >
              {sortedVersions.map((v) => (
                <option key={v.id} value={v.versionNumber}>
                  v{v.versionNumber} — {v.fileName} ({formatFileSize(v.fileSize)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Delta Summary Pill */}
        {isDifferentFiles && (
          <div className="px-6 py-2.5 bg-blue-50/70 border-b border-blue-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#0F2962]">
                Comparing v{leftVer.versionNumber} &rarr; v{rightVer.versionNumber}:
              </span>
              <span
                className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md text-[11px] ${
                  sizeDelta > 0
                    ? "bg-amber-100 text-amber-900"
                    : sizeDelta < 0
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {sizeDelta > 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-amber-700" />
                    +{formatFileSize(sizeDelta)}
                  </>
                ) : sizeDelta < 0 ? (
                  <>
                    <TrendingDown className="w-3 h-3 text-emerald-700" />
                    -{formatFileSize(Math.abs(sizeDelta))}
                  </>
                ) : (
                  "Identical size"
                )}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px]">
              <Fingerprint className="w-3.5 h-3.5 text-slate-500" />
              <span>Checksum:</span>
              {isHashIdentical ? (
                <span className="font-bold text-emerald-700 flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Identical Hash
                </span>
              ) : (
                <span className="font-bold text-blue-800">Unique Checksum (Modified Payload)</span>
              )}
            </div>
          </div>
        )}

        {/* Comparison Grid */}
        <div className="p-6 overflow-y-auto grid md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Left Version */}
          <div className="space-y-4 pr-0 md:pr-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-black text-xs">
                Version {leftVer.versionNumber}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {formatFileSize(leftVer.fileSize)}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">File Name</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  {leftVer.fileName}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Uploaded By</span>
                <span className="font-medium text-slate-700 flex items-center gap-1.5 mt-0.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {leftVer.uploadedBy ? `${leftVer.uploadedBy.firstName} ${leftVer.uploadedBy.lastName}` : "Staff"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Timestamp</span>
                <span className="font-mono text-slate-600 flex items-center gap-1.5 mt-0.5 text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatHumanDateTime(leftVer.createdAt)}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Change Log / Notes</span>
                <p className="mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs italic">
                  &ldquo;{leftVer.changeSummary || "Initial document upload"}&rdquo;
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SHA-256 Checksum</span>
                <p className="mt-1 p-2 rounded-lg bg-slate-900 text-amber-300 font-mono text-[10px] break-all">
                  {leftVer.sha256Checksum}
                </p>
              </div>
            </div>
          </div>

          {/* Right Version */}
          <div className="space-y-4 pt-4 md:pt-0 pl-0 md:pl-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-[#0F2962] text-white font-mono font-black text-xs">
                Version {rightVer.versionNumber}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {formatFileSize(rightVer.fileSize)}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">File Name</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  {rightVer.fileName}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Uploaded By</span>
                <span className="font-medium text-slate-700 flex items-center gap-1.5 mt-0.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {rightVer.uploadedBy ? `${rightVer.uploadedBy.firstName} ${rightVer.uploadedBy.lastName}` : "Staff"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Timestamp</span>
                <span className="font-mono text-slate-600 flex items-center gap-1.5 mt-0.5 text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatHumanDateTime(rightVer.createdAt)}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Change Log / Notes</span>
                <p className="mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs italic">
                  &ldquo;{rightVer.changeSummary || "No change log provided"}&rdquo;
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SHA-256 Checksum</span>
                <p className="mt-1 p-2 rounded-lg bg-slate-900 text-amber-300 font-mono text-[10px] break-all">
                  {rightVer.sha256Checksum}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200/80 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Zero-overwrite immutable audit history enforced
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
