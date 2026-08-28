"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  UploadCloud,
  FileCheck2,
  X,
  Loader2,
  Copy,
  Check,
} from "lucide-react";

export default function DocumentChecksumValidatorModal({
  isOpen,
  onClose,
  expectedChecksum,
  documentTitle,
  trackingNumber,
}: {
  isOpen: boolean;
  onClose: () => void;
  expectedChecksum: string;
  documentTitle: string;
  trackingNumber: string;
}) {
  const [localHash, setLocalHash] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsHashing(true);
    setLocalHash(null);

    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      setLocalHash(hashHex);
    } catch {
      setLocalHash("ERROR");
    } finally {
      setIsHashing(false);
    }
  };

  const isMatch = localHash && expectedChecksum && localHash.toLowerCase() === expectedChecksum.toLowerCase();
  const isMismatch = localHash && expectedChecksum && localHash.toLowerCase() !== expectedChecksum.toLowerCase() && localHash !== "ERROR";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-xl rounded-3xl bg-white border border-white/90 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0F2962] flex items-center justify-center font-bold border border-blue-100 shadow-xs">
              <FileCheck2 className="w-5 h-5 text-[#0F2962]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Cryptographic Integrity &amp; Tamper Validator
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Verify local file authenticity for <strong className="text-slate-800">{documentTitle}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Expected Record Hash */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span>On-Record SHA-256 Checksum:</span>
            <span className="font-mono text-slate-500">{trackingNumber}</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            <code className="text-[11px] font-mono text-slate-800 break-all select-all flex-1">
              {expectedChecksum || "No checksum on record"}
            </code>
            {expectedChecksum && (
              <button
                type="button"
                onClick={() => handleCopy(expectedChecksum)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                title="Copy hash"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Upload File for Verification */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            Select Local PDF to Verify
          </label>
          <label className="border-2 border-dashed border-slate-300 hover:border-[#0F2962] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition bg-slate-50 hover:bg-blue-50/50">
            <UploadCloud className="w-6 h-6 text-[#0F2962]" />
            <div className="text-xs text-slate-600">
              <span className="font-bold text-[#0F2962]">Click to upload</span> or drag and drop local PDF
            </div>
            {fileName && (
              <span className="text-[11px] font-mono font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                {fileName}
              </span>
            )}
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Comparison Result */}
        {isHashing ? (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-center gap-2 font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-[#0F2962]" />
            <span>Calculating SHA-256 cryptographic digest...</span>
          </div>
        ) : isMatch ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-2 font-black text-emerald-800">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Cryptographic Integrity Confirmed: Unaltered Original</span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-tight">
              The local file hash perfectly matches the immutable on-record checksum registered during institutional ingestion.
            </p>
          </div>
        ) : isMismatch ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 text-xs space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-2 font-black text-rose-800">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Integrity Warning: File Checksum Mismatch</span>
            </div>
            <p className="text-[11px] text-rose-700 leading-tight">
              The selected local file does not match the official checksum. It may have been modified, saved with alterations, or is a different version.
            </p>
            <div className="text-[10px] font-mono text-rose-600 bg-white/80 p-2 rounded-lg border border-rose-200 break-all">
              Calculated: {localHash}
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
