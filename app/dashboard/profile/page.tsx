import { getAuthenticatedUser } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import SignaturePadModal from "@/components/SignaturePadModal";
import ProfileClient from "@/components/ProfileClient";
import {
  Shield,
  User,
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
  const user = await getAuthenticatedUser();
  if (!user) return null;

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
    ADMIN: "bg-purple-100 text-purple-900",
    DIRECTOR: "bg-blue-100 text-blue-900",
    COORDINATOR: "bg-emerald-100 text-emerald-900",
    STAFF: "bg-slate-100 text-slate-700",
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
    <div className="p-6 lg:p-8 space-y-8 max-w-4xl mx-auto w-full">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Profile & E-Signature
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your registered electronic signature and review your activity history.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left: Profile Card */}
        <div className="lg:col-span-4 space-y-5">
          {/* Identity Card */}
          <div className="glass-card rounded-2xl p-6 border border-slate-200 bg-white space-y-4 shadow-xs">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-[#0F2962] text-white flex items-center justify-center text-2xl font-extrabold shadow-sm">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div>
                <span className="block font-bold text-slate-900 text-base">{user.fullName}</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold mt-1 ${roleColors[user.role] || "bg-slate-100 text-slate-600"}`}>
                  <Star className="w-3 h-3 mr-1" />
                  {roleLabel[user.role] || user.role}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2.5 text-xs">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-600 break-all">{user.email}</span>
              </div>
              {user.unitName && (
                <div className="flex items-center gap-2.5 text-xs">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-600">{user.unitName} ({user.unitCode})</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-xs">
                <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-600">Status: <span className="font-bold text-emerald-700">Active</span></span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass-card rounded-2xl p-5 border border-slate-200 bg-white shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">My Document Activity</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-2xl font-extrabold text-slate-900">{myStats.totalUploaded}</span>
                <span className="text-[10px] font-bold text-slate-500 block">Uploaded</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-2xl font-extrabold text-emerald-900">{myStats.totalApproved}</span>
                <span className="text-[10px] font-bold text-emerald-700 block">Approved</span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
                <span className="text-2xl font-extrabold text-blue-900">{myStats.totalPendingMySign}</span>
                <span className="text-[10px] font-bold text-blue-700 block">Pending My Sign</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-2xl font-extrabold text-amber-900">{myStats.totalReturned}</span>
                <span className="text-[10px] font-bold text-amber-700 block">Returned</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: E-Signature Management + Activity */}
        <div className="lg:col-span-8 space-y-6">
          {/* E-Signature Section */}
          <div className="glass-card rounded-2xl p-6 border border-slate-200 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PenLine className="w-4 h-4 text-[#0F2962]" />
                <h2 className="text-sm font-bold text-slate-900">Electronic Signature (E-Sign)</h2>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${user.signaturePath ? "bg-emerald-100" : "bg-amber-100"}`}>
                  {user.signaturePath ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <PenLine className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {user.signaturePath ? "Electronic Signature Registered" : "No Signature on File"}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {user.signaturePath
                      ? "Your signature is ready to be stamped on documents you approve."
                      : "Draw or upload your signature to enable electronic signing."}
                  </span>
                </div>
              </div>
            </div>

            <ProfileClient hasSignature={!!user.signaturePath} signaturePath={user.signaturePath} />

            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[11px] font-bold text-blue-900 block">How E-Signatures Work</span>
              <ul className="mt-1.5 space-y-1">
                <li className="text-[11px] text-blue-800 flex items-start gap-1.5">
                  <span className="text-blue-500 font-bold shrink-0">1.</span>
                  Draw or upload your handwritten signature image below.
                </li>
                <li className="text-[11px] text-blue-800 flex items-start gap-1.5">
                  <span className="text-blue-500 font-bold shrink-0">2.</span>
                  When you approve a document, the system scans the PDF for your printed name.
                </li>
                <li className="text-[11px] text-blue-800 flex items-start gap-1.5">
                  <span className="text-blue-500 font-bold shrink-0">3.</span>
                  Your signature image is stamped precisely above your name, non-overlapping with others.
                </li>
                <li className="text-[11px] text-blue-800 flex items-start gap-1.5">
                  <span className="text-blue-500 font-bold shrink-0">4.</span>
                  The stamped document becomes the new immutable version with a new SHA-256 hash.
                </li>
              </ul>
            </div>
          </div>

          {/* Recent Activity */}
          {recentActions.length > 0 && (
            <div className="glass-card rounded-2xl p-6 border border-slate-200 bg-white shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Clock className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-bold text-slate-900">Recent Approval Actions</h2>
              </div>
              <div className="space-y-3">
                {recentActions.map((action) => (
                  <div key={action.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-50 text-[#0F2962] flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-900 block">
                        {actionLabels[action.action] || action.action}
                      </span>
                      {action.document && (
                        <span className="text-[11px] text-slate-500 block font-mono">
                          {action.document.trackingNumber} — {action.document.title}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
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