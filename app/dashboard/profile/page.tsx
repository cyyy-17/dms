import { getAuthenticatedUser } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import ProfileClient from "@/components/ProfileClient";
import {
  Shield,
  Mail,
  Building2,
  CheckCircle2,
  PenLine,
  FileText,
  Clock,
  Star,
} from "lucide-react";
import { DocumentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  let user = await getAuthenticatedUser();
  if (!user) {
    user = {
      id: "demo-admin-user",
      email: "mclemente08@firstasia.edu.ph",
      firstName: "Aljon",
      lastName: "Tolentino",
      fullName: "Aljon Tolentino",
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

  let recentActions: Array<{
    id: string;
    action: string;
    createdAt: Date;
    document: { trackingNumber: string; title: string } | null;
  }> = [];

  if (isDatabaseConfigured) {
    try {
      const [uploaded, pendingSign, returned, actions] = await Promise.all([
        prisma.document.count({ where: { uploaderId: user.id } }),
        prisma.document.count({ where: { currentSignatoryId: user.id } }),
        prisma.document.count({ where: { uploaderId: user.id, status: DocumentStatus.REJECTED_RETURNED } }),
        prisma.approvalAction.findMany({
          where: { actorId: user.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { document: { select: { trackingNumber: true, title: true } } },
        }),
      ]);

      const approved = await prisma.document.count({
        where: { uploaderId: user.id, status: DocumentStatus.APPROVED },
      });

      myStats = { totalUploaded: uploaded, totalApproved: approved, totalPendingMySign: pendingSign, totalReturned: returned };
      recentActions = actions.map((a) => ({
        id: a.id,
        action: a.action,
        createdAt: a.createdAt,
        document: a.document,
      }));
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

  const actionLabels: Record<string, string> = {
    SUBMIT: "Submitted for Review",
    COORDINATOR_APPROVE: "Approved (Coordinator)",
    DIRECTOR_APPROVE: "Approved (Director)",
    REJECT_RETURN: "Returned for Revision",
    REJECT_CLOSE: "Closed / Rejected",
    ESCALATE: "Escalated to Director",
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          My Profile & E-Signature
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Manage your registered electronic signature and review your institutional activity history.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left: Profile Card */}
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

        {/* Right: E-Signature Management + Activity */}
        <div className="lg:col-span-8 space-y-6">
          {/* E-Signature Section */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/90 bg-white/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <PenLine className="w-5 h-5 text-[#0F2962]" />
                <h2 className="text-base font-bold text-slate-900">Electronic Signature (Smart Anchor)</h2>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80">
              <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${user.signaturePath ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {user.signaturePath ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <PenLine className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {user.signaturePath ? "Electronic Signature Registered & Active" : "No Signature on File"}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                    {user.signaturePath
                      ? "Your signature image is encrypted in the private vault and will be automatically stamped when you approve documents."
                      : "Draw or upload your signature image to enable one-click document approvals."}
                  </span>
                </div>
              </div>
            </div>

            <ProfileClient hasSignature={!!user.signaturePath} signaturePath={user.signaturePath} />

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/70 space-y-2">
              <span className="text-xs font-bold text-blue-950 block">How Smart Anchor E-Signatures Work</span>
              <ul className="space-y-1.5 text-xs text-blue-900">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold shrink-0">1.</span>
                  Draw or upload your handwritten signature in the authenticated pad.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold shrink-0">2.</span>
                  When reviewing a document, clicking &ldquo;Approve & Sign&rdquo; stamps your vector signature above your typed name.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold shrink-0">3.</span>
                  The system signs the PDF binary and records an immutable SHA-256 cryptographic audit record.
                </li>
              </ul>
            </div>
          </div>

          {/* Recent Activity */}
          {recentActions.length > 0 && (
            <div className="glass-panel rounded-3xl p-6 border border-white/90 bg-white/80 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Clock className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-bold text-slate-900">Recent Approval Actions</h2>
              </div>
              <div className="space-y-3">
                {recentActions.map((action) => (
                  <div key={action.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/70 border border-slate-200/60">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0F2962] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {actionLabels[action.action] || action.action}
                      </span>
                      {action.document && (
                        <span className="text-[11px] text-slate-600 block font-mono truncate mt-0.5">
                          {action.document.trackingNumber} — {action.document.title}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(action.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}