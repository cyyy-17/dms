"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  PenLine,
  Menu,
  X,
  Home,
  ChevronRight,
  Search,
  LayoutDashboard,
  FileText,
  FilePlus2,
  CheckSquare,
  Users,
  Building2,
  FileCode2,
  FileCheck2,
  Wrench,
  ShieldCheck,
  BellRing,
  LogOut,
  User,
} from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { getRoleLabel } from "@/lib/status-labels";
import dynamic from "next/dynamic";

const SignaturePadModal = dynamic(() => import("@/components/SignaturePadModal"), { ssr: false });
const QuickSearchModal = dynamic(() => import("@/components/QuickSearchModal"), { ssr: false });

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
  const router = useRouter();
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isAdmin = user.role === "ADMIN";

  // Human-Friendly Breadcrumbs Title
  const getBreadcrumbTitle = (path: string): string => {
    const segments = path.split("/").filter(Boolean);
    if (segments.length <= 1) return "Overview";

    const last = segments[segments.length - 1];
    const prev = segments[segments.length - 2];

    // Detect UUID or database ID pattern
    const isId =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(last) ||
      /^[0-9a-f]{24,}$/i.test(last) ||
      (prev === "documents" && last !== "new");

    if (isId) {
      if (prev === "documents") return "Document Inspector";
      if (prev === "users") return "User Account Details";
      if (prev === "units") return "Unit Specifications";
      return "Record Details";
    }

    const routeMap: Record<string, string> = {
      dashboard: "Overview",
      documents: "Document Repository",
      new: "Document Ingestion",
      approvals: "Sequential Approvals",
      profile: "My Profile & E-Signature",
      admin: "Administration",
      users: "User Governance",
      units: "Department Units",
      "document-types": "Document Classification Catalog",
      delegations: "Signatory Delegations",
      "documents-override": "Governance State Overrides",
      audit: "RA 10173 Audit Explorer",
      notifications: "System Notifications Queue",
    };

    if (routeMap[last]) return routeMap[last];

    return last
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const currentTitle = getBreadcrumbTitle(pathname);

  const hasSignature = !!user.signaturePath;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOutAction();
    } catch {
      // Ignored
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  const navLinks = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: ["STAFF", "COORDINATOR", "DIRECTOR", "ADMIN"] },
    { label: "Document Ingestion", href: "/dashboard/documents/new", icon: FilePlus2, roles: ["STAFF", "COORDINATOR", "DIRECTOR", "ADMIN"] },
    { label: "Document Repository", href: "/dashboard/documents", icon: FileText, roles: ["STAFF", "COORDINATOR", "DIRECTOR", "ADMIN"] },
    { label: "Sequential Approvals", href: "/dashboard/approvals", icon: CheckSquare, roles: ["COORDINATOR", "DIRECTOR", "ADMIN"] },
    { label: "My Profile & E-Sign", href: "/dashboard/profile", icon: User, roles: ["STAFF", "COORDINATOR", "DIRECTOR", "ADMIN"] },
  ];

  const adminLinks = [
    { label: "User Governance", href: "/dashboard/admin/users", icon: Users },
    { label: "Department Units", href: "/dashboard/admin/units", icon: Building2 },
    { label: "Document Types", href: "/dashboard/admin/document-types", icon: FileCode2 },
    { label: "Authority Delegation", href: "/dashboard/admin/delegations", icon: FileCheck2 },
    { label: "Document Overrides", href: "/dashboard/admin/documents-override", icon: Wrench },
    { label: "RA 10173 Audit Explorer", href: "/dashboard/admin/audit", icon: ShieldCheck },
    { label: "System Notifications", href: "/dashboard/admin/notifications", icon: BellRing },
  ];

  return (
    <>
      <header className="h-16 sm:h-18 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 px-3 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs transition-all">
        {/* Left: Hamburger & Dynamic Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0F2962] focus-visible:outline-none shrink-0"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-500 min-w-0">
            <Link href="/dashboard" className="hidden sm:flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition focus-visible:ring-2 focus-visible:ring-[#0F2962] focus-visible:outline-none rounded-lg p-0.5 shrink-0">
              <Home className="w-3.5 h-3.5" />
              <span>Portal</span>
            </Link>
            <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="font-black text-slate-900 text-xs sm:text-base tracking-tight truncate max-w-30 xs:max-w-50 sm:max-w-none">
              {currentTitle}
            </span>
          </div>
        </div>

        {/* Center: Quick Search Trigger Button */}
        <button
          type="button"
          onClick={() => setIsQuickSearchOpen(true)}
          className="hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-slate-200/90 bg-slate-50 hover:bg-slate-100/80 text-slate-400 hover:text-slate-700 text-xs font-medium transition-all shadow-inner cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0F2962] focus-visible:outline-none"
          title="Quick search tracking numbers and shortcuts (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="w-44 text-left truncate text-[11px] text-slate-500 font-medium">Quick search...</span>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-200 rounded">
            Ctrl+K
          </kbd>
        </button>

        {/* Right: Signature Indicator & Profile Summary */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Mobile search icon button */}
          <button
            type="button"
            onClick={() => setIsQuickSearchOpen(true)}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0F2962] focus-visible:outline-none"
            title="Search"
            aria-label="Open Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Quick Notification / Action Shortcut */}
          <Link
            href="/dashboard/approvals"
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200/90 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0F2962]"
            title="View sequential approval action items"
          >
            <BellRing className="w-3.5 h-3.5 text-[#0F2962]" />
            <span className="hidden sm:inline">Approvals</span>
          </Link>

          <button
            onClick={() => setIsSignatureModalOpen(true)}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border text-xs font-bold transition-all duration-200 flex items-center gap-2 shadow-xs hover:-translate-y-0.5 active:scale-98 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0F2962] focus-visible:outline-none ${
              hasSignature
                ? "bg-emerald-50/80 border-emerald-200/80 text-emerald-800 hover:bg-emerald-100"
                : "bg-amber-50/80 border-amber-200/80 text-amber-900 hover:bg-amber-100"
            }`}
            title="Manage institutional electronic signature"
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
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2.5 hover:opacity-90 transition group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0F2962] focus-visible:outline-none rounded-xl p-1"
            title="View profile & settings"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-linear-to-br from-[#0F2962] to-[#1E40AF] text-amber-400 font-black text-xs flex items-center justify-center border border-blue-900 shadow-md shrink-0">
              {user.fullName.charAt(0)}
            </div>
            <div className="hidden md:block text-left leading-tight">
              <span className="font-bold text-xs text-slate-900 block truncate max-w-36 group-hover:text-[#0F2962]">
                {user.fullName}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block">
                {getRoleLabel(user.role)} {user.unitCode ? `• ${user.unitCode}` : ""}
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* Mobile Slide-Out Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-950 text-slate-200 border-r border-slate-800 shadow-2xl p-5 space-y-6 z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/95 p-1 flex items-center justify-center border border-amber-400/40 shadow-md shrink-0">
                  <Image
                    src="/images/faith-crest.png"
                    alt="FAITH Crest"
                    width={32}
                    height={32}
                    className="w-auto h-full object-contain"
                  />
                </div>
                <div>
                  <span className="font-black text-white text-sm block">SASDMS</span>
                  <span className="text-[10px] text-slate-400 block">{user.unitName || "FAITH Colleges"}</span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 dark-scroll">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 block mb-1">
                  Menu
                </span>
                {navLinks
                  .filter((link) => link.roles.includes(user.role))
                  .map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                          isActive
                            ? "bg-[#0F2962] text-white border border-blue-400/40"
                            : "text-slate-400 hover:bg-slate-900 hover:text-white"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
              </div>

              {isAdmin && (
                <div className="space-y-1 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 block mb-1">
                    Administration
                  </span>
                  {adminLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition ${
                          isActive
                            ? "bg-[#0F2962] text-white border border-blue-400/40"
                            : "text-slate-400 hover:bg-slate-900 hover:text-white"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 text-xs font-bold flex items-center justify-center gap-2 border border-slate-800 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Pad Modal */}
      <SignaturePadModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSignatureSaved={() => {
          setIsSignatureModalOpen(false);
          router.refresh();
        }}
      />

      {/* Quick Search / Command Palette Modal */}
      <QuickSearchModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        userRole={user.role}
      />
    </>
  );
}
