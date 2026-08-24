"use client";

import { useState } from "react";
import SignaturePadModal from "@/components/SignaturePadModal";
import { PenLine, CheckCircle2 } from "lucide-react";

interface ProfileClientProps {
  hasSignature: boolean;
  signaturePath: string | null;
}

export default function ProfileClient({ hasSignature: initialHas }: ProfileClientProps) {
  const [hasSignature, setHasSignature] = useState(initialHas);
  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => setIsSignaturePadOpen(true)}
          className="flex-1 px-4 py-2.5 rounded-lg bg-[#0F2962] hover:bg-[#091a42] text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
        >
          <PenLine className="w-4 h-4 text-amber-400" />
          <span>{hasSignature ? "Update My E-Signature" : "Set Up My E-Signature"}</span>
        </button>

        {hasSignature && (
          <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-bold self-center">
            <CheckCircle2 className="w-4 h-4" />
            <span>Signature Registered</span>
          </div>
        )}
      </div>

      <SignaturePadModal
        isOpen={isSignaturePadOpen}
        onClose={() => setIsSignaturePadOpen(false)}
        onSignatureSaved={() => {
          setHasSignature(true);
          setIsSignaturePadOpen(false);
        }}
      />
    </>
  );
}