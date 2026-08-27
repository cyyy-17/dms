import { getAuthenticatedUser } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import ProfileClient from "@/components/ProfileClient";
import {
  Shield,
  Mail,
  Building2,
  Star,
} from "lucide-react";
import { DocumentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  let user = await getAuthenticatedUser();
  if (!user) {
    user = {
      id: "demo-admin-user",
      email: "admin@firstasia.edu.ph",
      firstName: "System",
      middleName: null,
      lastName: "Administrator",
      suffix: null,
      title: "System Administrator",
      fullName: "System Administrator",
      employeeId: "EMP-ADMIN-001",
      role: "ADMIN",
      status: "ACTIVE",
      unitId: null,
      unitCode: "ADMIN",
      unitName: "System Administration",
      signaturePath: null,
    };
  }

  // Stats for the profile card
  let myStats = {
    totalUploaded: 0,
    totalApproved: 0,
    totalPendingMySign: 0,
    totalReturned: 0,
  };

  if (isDatabaseConfigured) {
    try {
      const [uploaded, pendingSign, returned] = await Promise.all([
        prisma.document.count({ where: { uploaderId: user.id } }),
        prisma.document.count({ where: { currentSignatoryId: user.id } }),
        prisma.document.count({ where: { uploaderId: user.id, status: DocumentStatus.REJECTED_RETURNED } }),
      ]);

      const approved = await prisma.document.count({
        where: { uploaderId: user.id, status: DocumentStatus.APPROVED },
      });

      myStats = { totalUploaded: uploaded, totalApproved: approved, totalPendingMySign: pendingSign, totalReturned: returned };
    } catch {
      // keep defaults
    }
  }

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-900 border-purple-300",
    DIRECTOR: "bg-blue-100 text-blue-900 border-blue-300",
    COORDINATOR: "bg-emerald-100 text-emerald-900 border-emerald-300",
    STAFF: "bg-slate-100 text-slate-800 border-slate-300",
  };

  const roleLabel: Record<string, string> = {
    ADMIN: "System Administrator",
    DIRECTOR: "Executive Director",
    COORDINATOR: "Unit Coordinator",
    STAFF: "Department Staff",
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          My Profile & Security
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Manage your personal details, credentials, electronic signature, and audit log.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left: Profile Card & Activity Summary */}
        <div className="lg:col-span-4 space-y-5">
          {/* Identity Card */}
          <div className="glass-panel rounded-3xl p-6 border border-white/90 bg-white/80 space-y-4 shadow-sm">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#0F2962] to-[#1E40AF] text-amber-400 flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-950/20 border border-blue-400/30">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div>
                <span className="block font-black text-slate-900 text-base">{user.fullName}</span>
                <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-black border mt-1.5 ${roleColors[user.role] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                  <Star className="w-3 h-3 mr-1 text-amber-500" />
                  {roleLabel[user.role] || user.role}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2.5 text-xs">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-600 font-medium break-all">{user.email}</span>
              </div>
              {user.unitName && (
                <div className="flex items-center gap-2.5 text-xs">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-600 font-medium">{user.unitName} ({user.unitCode})</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-xs">
                <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-600 font-medium">Status: <span className="font-bold text-emerald-700">Verified Active</span></span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass-panel rounded-3xl p-5 border border-white/90 bg-white/80 shadow-sm space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">My Document Activity</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center shadow-xs">
                <span className="text-2xl font-black text-slate-900 font-mono block">{myStats.totalUploaded}</span>
                <span className="text-[10px] font-bold text-slate-500 block mt-0.5">Uploaded</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center shadow-xs">
                <span className="text-2xl font-black text-emerald-900 font-mono block">{myStats.totalApproved}</span>
                <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">Approved</span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 text-center shadow-xs">
                <span className="text-2xl font-black text-blue-900 font-mono block">{myStats.totalPendingMySign}</span>
                <span className="text-[10px] font-bold text-blue-700 block mt-0.5">Pending Sign</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-center shadow-xs">
                <span className="text-2xl font-black text-amber-900 font-mono block">{myStats.totalReturned}</span>
                <span className="text-[10px] font-bold text-amber-700 block mt-0.5">Returned</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Comprehensive Self Profile Client */}
        <div className="lg:col-span-8 space-y-6">
          <ProfileClient user={user} />
        </div>
      </div>
    </div>
  );
}