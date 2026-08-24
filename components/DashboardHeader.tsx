"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  PenLine,
  Menu,
  X,
} from "lucide-react";
import SignaturePadModal from "@/components/SignaturePadModal";

interface DashboardHeaderProps {
  user: {
    fullName: string;
    email: string;
    role: string;
    unitName: string | null;
    unitCode: string | null;
    signaturePath?: string | null;
  };
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname();
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Generate dynamic breadcrumb
  const pathSegments = pathname.split("/").filter(Boolean);
  const currentTitle = pathSegments.length > 1
    ? pathSegments[pathSegments.length - 1]
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "Overview";

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
      {/* Left: Breadcrumbs / Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
          aria-label="Toggle Navigation"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="hidden sm:inline text-slate-400">Dashboard</span>
          <span className="hidden sm:inline text-slate-300">/</span>
          <span className="font-extrabold text-slate-900 text-sm tracking-tight">{currentTitle}</span>
        </div>
      </div>

      {/* Right: Smart E-Signature Trigger & User Role */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsSignatureModalOpen(true)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-[#0F2962] text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          title="Draw or upload your institutional electronic signature"
        >
          <PenLine className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">My E-Signature</span>
        </button>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#0F2962] text-amber-400 font-bold text-xs flex items-center justify-center border border-blue-900 shadow-xs shrink-0">
            {user.fullName.charAt(0)}
          </div>
          <div className="hidden md:block text-left leading-tight">
            <span className="font-bold text-xs text-slate-900 block truncate max-w-35">
              {user.fullName}
            </span>
            <span className="text-[10px] text-slate-500 font-mono font-medium block">
              {user.role} {user.unitCode ? `• ${user.unitCode}` : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Signature Pad Modal */}
      <SignaturePadModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSignatureSaved={() => {
          setIsSignatureModalOpen(false);
        }}
      />
    </header>
  );
}
