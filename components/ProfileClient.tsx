"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const SignaturePadModal = dynamic(() => import("@/components/SignaturePadModal"), { ssr: false });
import {
  updateUserProfileDetailsAction,
  updateUserPasswordAction,
  getSignedSignatureUrlAction,
} from "@/actions/auth";
import {
  User,
  Lock,
  PenLine,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  LogOut,
  Save,
  KeyRound,
  Image as ImageIcon,
  History,
} from "lucide-react";
import DataTableWrapper from "@/components/DataTableWrapper";

export interface UserAuditLogItem {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  createdAt: Date;
  ipAddress: string | null;
  details: unknown;
}

interface ProfileClientProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    suffix?: string | null;
    title?: string | null;
    employeeId?: string | null;
    role: string;
    unitName: string | null;
    unitCode: string | null;
    signaturePath: string | null;
  };
  auditLogs?: UserAuditLogItem[];
}

function getActionBadge(action: string) {
  switch (action) {
    case "DOCUMENT_CREATE":
      return { label: "Document Ingested", color: "bg-blue-50 text-blue-900 border-blue-200" };
    case "DOCUMENT_VIEW":
      return { label: "Document Inspected", color: "bg-slate-100 text-slate-700 border-slate-200" };
    case "DOCUMENT_DOWNLOAD":
      return { label: "PDF Downloaded", color: "bg-teal-50 text-teal-800 border-teal-200" };
    case "DOCUMENT_SUBMIT":
      return { label: "Submitted for Review", color: "bg-indigo-50 text-indigo-900 border-indigo-200" };
    case "DOCUMENT_APPROVE_COORDINATOR":
      return { label: "Coordinator Approved", color: "bg-blue-50 text-blue-900 border-blue-200" };
    case "DOCUMENT_APPROVE_DIRECTOR":
      return { label: "Executive Approved", color: "bg-emerald-50 text-emerald-900 border-emerald-200" };
    case "DOCUMENT_REJECT_RETURN":
      return { label: "Returned for Revision", color: "bg-amber-50 text-amber-900 border-amber-200" };
    case "DOCUMENT_REJECT_CLOSE":
      return { label: "Terminally Rejected", color: "bg-red-50 text-red-900 border-red-200" };
    case "DOCUMENT_AUTO_ESCALATE":
      return { label: "Auto Escalated", color: "bg-rose-50 text-rose-900 border-rose-200" };
    case "DOCUMENT_VERSION_UPLOAD":
      return { label: "New Version Attached", color: "bg-purple-50 text-purple-900 border-purple-200" };
    case "USER_REGISTER":
      return { label: "Account Registered", color: "bg-blue-50 text-blue-900 border-blue-200" };
    case "USER_APPROVE":
      return { label: "Account Verified", color: "bg-emerald-50 text-emerald-900 border-emerald-200" };
    case "USER_PASSWORD_CHANGE":
      return { label: "Password Updated", color: "bg-amber-50 text-amber-900 border-amber-200" };
    case "USER_SIGNATURE_UPDATE":
      return { label: "E-Signature Saved", color: "bg-emerald-50 text-emerald-900 border-emerald-200" };
    case "DELEGATION_ASSIGNED":
      return { label: "Delegation Assigned", color: "bg-blue-50 text-blue-900 border-blue-200" };
    case "DELEGATION_REVOKED":
      return { label: "Delegation Revoked", color: "bg-slate-100 text-slate-700 border-slate-200" };
    default:
      return { label: action.replace(/_/g, " "), color: "bg-slate-100 text-slate-700 border-slate-200" };
  }
}

function formatAuditDetail(details: unknown): string {
  if (!details) return "—";
  if (typeof details === "string") return details;
  if (typeof details === "object") {
    const d = details as Record<string, unknown>;
    if (d.trackingNumber) return `Tracking: ${d.trackingNumber}`;
    if (d.title) return `Doc: ${d.title}`;
    if (d.reason) return `Reason: ${d.reason}`;
    if (d.message) return String(d.message);
    try {
      return JSON.stringify(details);
    } catch {
      return "Details recorded";
    }
  }
  return String(details);
}

export default function ProfileClient({ user, auditLogs = [] }: ProfileClientProps) {
  const router = useRouter();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<"details" | "security" | "signature" | "activity">("details");

  // Profile Details State
  const [firstName, setFirstName] = useState(user.firstName);
  const [middleName, setMiddleName] = useState(user.middleName || "");
  const [lastName, setLastName] = useState(user.lastName);
  const [suffix, setSuffix] = useState(user.suffix || "");
  const [title, setTitle] = useState(user.title || "");
  const [employeeId, setEmployeeId] = useState(user.employeeId || "");
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [detailsSuccess, setDetailsSuccess] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Security / Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Electronic Signature State
  const [hasSignature, setHasSignature] = useState(!!user.signaturePath);
  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState(false);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Load signature preview when tab is active
  useEffect(() => {
    if (activeTab === "signature" && user.signaturePath && !signaturePreviewUrl) {
      let isMounted = true;
      setIsLoadingPreview(true);
      getSignedSignatureUrlAction(user.signaturePath).then((res) => {
        if (isMounted) {
          setIsLoadingPreview(false);
          if (res.success && res.signedUrl) {
            setSignaturePreviewUrl(res.signedUrl);
          }
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [activeTab, user.signaturePath, signaturePreviewUrl]);

  // Handle Save Profile Details
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDetails(true);
    setDetailsSuccess(null);
    setDetailsError(null);

    const res = await updateUserProfileDetailsAction({
      firstName,
      middleName: middleName || undefined,
      lastName,
      suffix: suffix || undefined,
      title: title || undefined,
      employeeId: employeeId || undefined,
    });

    setIsSavingDetails(false);

    if (res.success) {
      setDetailsSuccess("Institutional profile details updated successfully.");
      router.refresh();
      setTimeout(() => setDetailsSuccess(null), 4000);
    } else {
      setDetailsError(res.error || "Failed to update profile details.");
    }
  };

  // Handle Password Update with Immediate Auto Logout
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);

    const res = await updateUserPasswordAction({
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword
    });

    if (res.success) {
      setPasswordSuccess("Password updated successfully! Session invalidated. Redirecting to sign in...");
      setTimeout(() => {
        window.location.href = "/login?password_updated=true";
      }, 1500);
    } else {
      setIsUpdatingPassword(false);
      setPasswordError(res.error || "Failed to update password. Please check your current password.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-slate-200/70 border border-slate-300/60 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={`w-full py-2.5 px-2 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
            activeTab === "details"
              ? "bg-white text-[#0F2962] shadow-sm font-extrabold"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span className="truncate">Profile Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`w-full py-2.5 px-2 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
            activeTab === "security"
              ? "bg-white text-[#0F2962] shadow-sm font-extrabold"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <KeyRound className="w-4 h-4 shrink-0" />
          <span className="truncate">Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("signature")}
          className={`w-full py-2.5 px-2 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
            activeTab === "signature"
              ? "bg-white text-[#0F2962] shadow-sm font-extrabold"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <PenLine className="w-4 h-4 shrink-0" />
          <span className="truncate">E-Signature</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("activity")}
          className={`w-full py-2.5 px-2 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
            activeTab === "activity"
              ? "bg-white text-[#0F2962] shadow-sm font-extrabold"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <History className="w-4 h-4 shrink-0" />
          <span className="truncate">Activity Log</span>
        </button>
      </div>

      {/* TAB 1: PROFILE DETAILS FORM */}
      {activeTab === "details" && (
        <div className="glass-panel rounded-3xl p-4.5 sm:p-7 border border-white/90 bg-white/90 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-base font-black text-slate-900">Personal & Employee Details</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Update your institutional identity records, middle initial, and designation.
            </p>
          </div>

          {detailsSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-3 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{detailsSuccess}</span>
            </div>
          )}

          {detailsError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{detailsError}</span>
            </div>
          )}

          <form onSubmit={handleSaveDetails} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Middle Initial / Name</label>
                <input
                  type="text"
                  placeholder="e.g. S. or Santos"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Suffix / Degree (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. PhD, CPA, Jr., III"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Official Position / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Director, Student and Alumni Services"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Employee ID / Faculty No.</label>
                <input
                  type="text"
                  placeholder="e.g. EMP-2026-081"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Institutional Email</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 bg-slate-100/80 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Governed by FAITH Colleges SSO</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSavingDetails}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white text-xs font-extrabold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:scale-98 disabled:opacity-50"
              >
                {isSavingDetails ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-amber-400" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: SECURITY & PASSWORD UPDATE (WITH AUTO LOGOUT) */}
      {activeTab === "security" && (
        <div className="glass-panel rounded-3xl p-4.5 sm:p-7 border border-white/90 bg-white/90 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-base font-black text-slate-900">Change Institutional Password</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Ensure your account adheres to FAITH Colleges credential security guidelines.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-medium flex items-start gap-3 shadow-xs">
            <LogOut className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-amber-900 block">Automatic Session Invalidation</strong>
              <span>Updating your password will immediately terminate your active session. You will be redirected to the sign-in page.</span>
            </div>
          </div>

          {passwordSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-3 shadow-xs animate-pulse">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Institutional Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password (Min. 8 Characters)</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Enter strong new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-linear-to-r from-rose-700 to-rose-900 hover:from-rose-800 hover:to-rose-950 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:scale-98 disabled:opacity-50"
              >
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Updating Password & Logging Out...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Update Password & Log Out</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: SMART ANCHOR ELECTRONIC SIGNATURE */}
      {activeTab === "signature" && (
        <div className="glass-panel rounded-3xl p-4.5 sm:p-7 border border-white/90 bg-white/90 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-base font-black text-slate-900">Electronic Signature (Smart Anchor)</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Institutional electronic signatures are embedded via Smart Anchor detection on review approvals.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${hasSignature ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {hasSignature ? <CheckCircle2 className="w-6 h-6" /> : <PenLine className="w-6 h-6" />}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">{hasSignature ? "Electronic Signature Registered & Active" : "No Signature on File"}</span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                  {hasSignature ? "Your signature image is encrypted in the private vault." : "Draw or upload your signature image to enable one-click document approvals."}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSignaturePadOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0F2962] hover:bg-[#091a42] text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer shrink-0 hover:-translate-y-0.5 active:scale-98"
            >
              <PenLine className="w-4 h-4 text-amber-400" />
              <span>{hasSignature ? "Update Signature" : "Set Up Signature"}</span>
            </button>
          </div>

          {hasSignature && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#0F2962]" />
                  <span>Registered Signature Vault Preview</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">Ready for Smart Stamping</span>
              </div>

              <div className="h-32 rounded-xl bg-slate-50/80 border border-dashed border-slate-300 flex items-center justify-center p-3 overflow-hidden">
                {isLoadingPreview ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0F2962]" />
                    <span>Loading cryptographic signature stream...</span>
                  </div>
                ) : signaturePreviewUrl ? (
                  <img src={signaturePreviewUrl} alt="Registered Signature Preview" className="max-h-full max-w-full object-contain filter drop-shadow-xs" />
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Signature encrypted in private storage vault.</span>
                )}
              </div>
            </div>
          )}

          <SignaturePadModal
            isOpen={isSignaturePadOpen}
            onClose={() => setIsSignaturePadOpen(false)}
            onSignatureSaved={() => {
              setHasSignature(true);
              setIsSignaturePadOpen(false);
              router.refresh();
            }}
          />
        </div>
      )}

      {/* TAB 4: PERSONAL AUDIT ACTIVITY LOG */}
      {activeTab === "activity" && (
        <div className="glass-panel rounded-3xl p-4.5 sm:p-7 border border-white/90 bg-white/90 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-black text-slate-900">My Activity & Security Log</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Your recent actions and compliance trail under RA 10173 governance.
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl shrink-0">
              {auditLogs.length} Events
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs rounded-2xl bg-slate-50 border border-slate-200/80">
              No recent activity log events recorded for this account.
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
              <DataTableWrapper>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <th className="py-3 px-3 sm:py-3.5 sm:px-4">Action Event</th>
                      <th className="hidden sm:table-cell py-3 px-3 sm:py-3.5 sm:px-4">Target Type</th>
                      <th className="py-3 px-3 sm:py-3.5 sm:px-4">Date & Time</th>
                      <th className="hidden md:table-cell py-3 px-3 sm:py-3.5 sm:px-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {auditLogs.map((log) => {
                      const badge = getActionBadge(log.action);
                      return (
                        <tr key={log.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="py-3 px-3 sm:py-3.5 sm:px-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9.5px] sm:text-[10.5px] font-black border shadow-2xs ${badge.color}`}>
                                {badge.label}
                              </span>
                              <div className="sm:hidden flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                                <span className="uppercase font-bold text-slate-500">{log.targetType}</span>
                                {log.targetId && <span>• #{log.targetId.slice(0, 8)}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell py-3 px-3 sm:py-3.5 sm:px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200/70">
                              {log.targetType}
                            </span>
                          </td>
                          <td className="py-3 px-3 sm:py-3.5 sm:px-4 text-slate-500 text-[10.5px] sm:text-[11px] whitespace-nowrap font-mono">
                            {new Date(log.createdAt).toLocaleString("en-PH", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </td>
                          <td className="hidden md:table-cell py-3 px-3 sm:py-3.5 sm:px-4 text-right text-[11px] text-slate-500 max-w-56 truncate font-mono">
                            {formatAuditDetail(log.details)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </DataTableWrapper>
            </div>
          )}
        </div>
      )}
    </div>
  );
}