"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  PenLine,
  Menu,
  X,
  Shield,
  CheckCircle2,
  AlertCircle,
  Home,
  ChevronRight,
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

  // Generate dynamic breadcrumbs
  const pathSegments = pathname.split("/").filter(Boolean);
  const currentTitle =
    pathSegments.length > 1
      ? pathSegments[pathSegments.length - 1]
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : "Overview";

  const hasSignature = !!user.signaturePath;

  return (
    <header className="h-18 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs transition-all">
      {/* Left: Breadcrumbs / Title */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
          aria-label="Toggle Navigation"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition">
            <Home className="w-3.5 h-3.5" />
            <span>Portal</span>
          </div>
          <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-slate-300" />
          <span className="font-black text-slate-900 text-sm sm:text-base tracking-tight">
            {currentTitle}
          </span>
        </div>
      </div>

      {/* Right: Signature Indicator & Profile Summary */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={() => setIsSignatureModalOpen(true)}
          className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all duration-200 flex items-center gap-2 shadow-xs hover:-translate-y-0.5 active:scale-98 cursor-pointer ${
            hasSignature
              ? "bg-emerald-50/80 border-emerald-200/80 text-emerald-800 hover:bg-emerald-100"
              : "bg-amber-50/80 border-amber-200/80 text-amber-900 hover:bg-amber-100"
          }`}
          title="Manage electronic signature"
        >
          <PenLine className="w-3.5 h-3.5 text-[#0F2962]" />
          <span className="hidden sm:inline">My E-Signature</span>
          {hasSignature ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active signature on file" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Signature required" />
          )}
        </button>

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        {/* User Identity Chip */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F2962] to-[#1E40AF] text-amber-400 font-black text-xs flex items-center justify-center border border-blue-900 shadow-md shrink-0">
            {user.fullName.charAt(0)}
          </div>
          <div className="hidden md:block text-left leading-tight">
            <span className="font-bold text-xs text-slate-900 block truncate max-w-40">
              {user.fullName}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
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
          window.location.reload();
        }}
      />
    </header>
  );
}
