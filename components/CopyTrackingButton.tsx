"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useOptionalToast } from "@/components/ToastContext";

export default function CopyTrackingButton({ trackingNumber }: { trackingNumber: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useOptionalToast();

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(trackingNumber);
      setCopied(true);

      if (toast) {
        toast.showToast({
          title: "Tracking Number Copied",
          message: `${trackingNumber} copied to your clipboard.`,
          type: "success",
          duration: 3000,
        });
      }

      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] font-black transition-all duration-200 cursor-pointer shadow-xs active:scale-95 ${
        copied
          ? "bg-emerald-100 text-emerald-900 border border-emerald-300 ring-2 ring-emerald-400/30"
          : "bg-blue-50/90 text-[#0F2962] border border-blue-200/90 hover:bg-blue-100 hover:border-blue-300"
      }`}
      title={copied ? "Copied to clipboard!" : "Click to copy tracking number"}
    >
      <span>{trackingNumber}</span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-600 animate-in zoom-in-75 duration-200" />
      ) : (
        <Copy className="w-3 h-3 text-[#0F2962]/70 group-hover:text-[#0F2962]" />
      )}
    </button>
  );
}
