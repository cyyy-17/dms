"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOutAction } from "@/actions/auth";
import { getRoleLabel } from "@/lib/status-labels";
import {
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
  Shield,
  Loader2,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  user: {
    fullName: string;
    email: string;
    role: string;
    unitName: string | null;
    unitCode: string | null;
  };
}

export default function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isAdmin = user.role === "ADMIN";

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOutAction();
    } catch {
      window.location.href = "/login";
    } finally {
      window.location.href = "/login";
    }
  };

  const navLinks = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["STAFF", "COORDINATOR", "DIRECTOR", "ADMIN"],
    },
    {
      label: "Document Repository",
      href: "/dashboard/documents",
      icon: FileText,
      roles: ["STAFF", "COORDINATOR", "DIRECTOR", "ADMIN"],
    },
    {
      label: "New Submission",
      href: "/dashboard/documents/new",
      icon: FilePlus2,
      roles: ["STAFF", "COORDINATOR", "DIRECTOR", "ADMIN"],
    },
    {
      label: "Approval Queue",
      href: "/dashboard/approvals",
      icon: CheckSquare,
      roles: ["COORDINATOR", "DIRECTOR", "ADMIN"],
    },
    {
      label: "My E-Signature",
      href: "/dashboard/profile",
      icon: Shield,
      roles: ["STAFF", "COORDINATOR", "DIRECTOR", "ADMIN"],
    },
  ];

  const adminLinks = [
    {
      label: "Staff & Users",
      href: "/dashboard/admin/users",
      icon: Users,
    },
    {
      label: "Department Units",
      href: "/dashboard/admin/units",
      icon: Building2,
    },
    {
      label: "Document Types",
      href: "/dashboard/admin/document-types",
      icon: FileCode2,
    },
    {
      label: "Signatory Delegations",
      href: "/dashboard/admin/delegations",
      icon: FileCheck2,
    },
    {
      label: "Emergency Overrides",
      href: "/dashboard/admin/documents-override",
      icon: Wrench,
    },
    {
      label: "RA 10173 Audit Logs",
      href: "/dashboard/admin/audit",
      icon: ShieldCheck,
    },
    {
      label: "Notification Dispatcher",
      href: "/dashboard/admin/notifications",
      icon: BellRing,
    },
  ];

  return (
    <aside className="w-68 bg-slate-950 text-slate-300 flex flex-col shrink-0 border-r border-slate-800/80 selection:bg-amber-400 selection:text-slate-950 z-40">
      {/* Brand Header */}
      <div className="h-18 px-6 flex items-center gap-3.5 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#0F2962] to-[#1E40AF] flex items-center justify-center text-amber-400 font-black text-lg shadow-lg shadow-blue-950/50 border border-blue-400/30 shrink-0">
          FA
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-white tracking-tight text-sm">
              SASDMS
            </span>
            <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-400/15 text-amber-300 border border-amber-400/30">
              FAITH
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium truncate block">
            Student & Alumni Services
          </span>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-slate-800 to-slate-700 text-amber-400 font-black text-sm flex items-center justify-center border border-slate-600/80 shadow-md shrink-0">
            {user.fullName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-white truncate block">
              {user.fullName}
            </span>
            <span className="text-[11px] text-slate-400 truncate block">
              {user.email}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-blue-950/90 text-blue-300 border border-blue-700/60 shadow-inner">
            <Shield className="w-3 h-3 text-amber-400" />
            <span>{getRoleLabel(user.role)}</span>
          </span>
          {user.unitCode && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-amber-950/90 text-amber-300 border border-amber-700/60 shadow-inner">
              <Building2 className="w-3 h-3 text-amber-400" />
              <span>{user.unitCode}</span>
            </span>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto dark-scroll">
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
            Operations & Workflow
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
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group ${
                    isActive
                      ? "bg-linear-to-r from-[#1E40AF] to-[#0F2962] text-white shadow-md shadow-blue-950/40 border border-blue-400/30"
                      : "text-slate-400 hover:bg-slate-900/80 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 transition ${isActive ? "text-amber-400" : "text-slate-400 group-hover:text-amber-400"}`} />
                    <span className="truncate">{link.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400" />}
                </Link>
              );
            })}
        </div>

        {isAdmin && (
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
              Enterprise Administration
            </span>
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group ${
                    isActive
                      ? "bg-linear-to-r from-[#1E40AF] to-[#0F2962] text-white shadow-md shadow-blue-950/40 border border-blue-400/30"
                      : "text-slate-400 hover:bg-slate-900/80 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 transition ${isActive ? "text-amber-400" : "text-slate-400 group-hover:text-amber-400"}`} />
                    <span className="truncate">{link.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400" />}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Logout Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950">
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 bg-red-950/30 hover:bg-red-950/60 hover:text-red-300 border border-red-900/40 transition-all duration-200 disabled:opacity-50 cursor-pointer"
        >
          {isSigningOut ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-red-400" />
              <span>Signing Out...</span>
            </>
          ) : (
            <>
              <LogOut className="w-4 h-4" />
              <span>Sign Out Session</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
