"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOutAction } from "@/actions/auth";
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
      router.push("/login");
    } finally {
      router.push("/login");
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
      label: "Documents",
      href: "/dashboard/documents",
      icon: FileText,
      roles: ["STAFF", "COORDINATOR", "DIRECTOR", "ADMIN"],
    },
    {
      label: "Upload Document",
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
      label: "My Profile & E-Signature",
      href: "/dashboard/profile",
      icon: Shield,
      roles: ["STAFF", "COORDINATOR", "DIRECTOR", "ADMIN"],
    },
  ];

  const adminLinks = [
    {
      label: "Employee & Users",
      href: "/dashboard/admin/users",
      icon: Users,
    },
    {
      label: "Department Units",
      href: "/dashboard/admin/units",
      icon: Building2,
    },
    {
      label: "Classification Types",
      href: "/dashboard/admin/document-types",
      icon: FileCode2,
    },
    {
      label: "Signatory Delegations",
      href: "/dashboard/admin/delegations",
      icon: FileCheck2,
    },
    {
      label: "Document Overrides",
      href: "/dashboard/admin/documents-override",
      icon: Wrench,
    },
    {
      label: "RA 10173 Audit Logs",
      href: "/dashboard/admin/audit",
      icon: ShieldCheck,
    },
    {
      label: "Notification Queue",
      href: "/dashboard/admin/notifications",
      icon: BellRing,
    },
  ];

  return (
    <aside className="w-64 bg-[#0B1B3D] text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80 bg-[#07132B]">
        <div className="w-9 h-9 rounded-lg bg-[#1E40AF] flex items-center justify-center text-amber-400 font-bold text-base shadow">
          FA
        </div>
        <div>
          <span className="font-bold text-white tracking-tight block text-sm">
            SASDMS
          </span>
          <span className="text-[10px] text-slate-400 font-medium block">
            Student & Alumni Services
          </span>
        </div>
      </div>

      {/* User Unit & Role Card */}
      <div className="p-4 border-b border-slate-800/60 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 text-amber-400 font-bold text-sm flex items-center justify-center border border-slate-600 shrink-0">
            {user.fullName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-white truncate block">
              {user.fullName}
            </span>
            <span className="text-[11px] text-slate-400 truncate block">
              {user.email}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50 uppercase">
            <Shield className="w-3 h-3" />
            <span>{user.role}</span>
          </span>
          {user.unitCode && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/50 uppercase">
              <Building2 className="w-3 h-3" />
              <span>{user.unitCode}</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Operations
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
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? "bg-[#1E40AF] text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
        </div>

        {isAdmin && (
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Data Management & Admin
            </span>
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? "bg-[#1E40AF] text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Logout Footer */}
      <div className="p-3 border-t border-slate-800 bg-[#07132B]">
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/40 hover:text-red-300 transition disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
        </button>
      </div>
    </aside>
  );
}
