"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyTrackingButton({ trackingNumber }: { trackingNumber: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] font-black transition-all cursor-pointer ${
        copied
          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
          : "bg-blue-50 text-[#0F2962] border border-blue-200/80 hover:bg-blue-100 hover:border-blue-300"
      }`}
      title={copied ? "Copied tracking number!" : "Click to copy tracking number"}
    >
      <span>{trackingNumber}</span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-600 animate-in zoom-in-50" />
      ) : (
        <Copy className="w-3 h-3 text-blue-500 opacity-60 group-hover:opacity-100" />
      )}
    </button>
  );
}
