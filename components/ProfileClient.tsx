"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SignaturePadModal from "@/components/SignaturePadModal";
import {
  updateUserProfileDetailsAction,
  updateUserPasswordAction,
} from "@/actions/auth";
import {
  User,
  Lock,
  PenLine,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  LogOut,
  Save,
  KeyRound,
} from "lucide-react";

interface ProfileClientProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    employeeId?: string | null;
    role: string;
    unitName: string | null;
    unitCode: string | null;
    signaturePath: string | null;
  };
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<"details" | "security" | "signature">("details");

  // Profile Details State
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
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

  // Handle Profile Details Form Submission
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsError(null);
    setDetailsSuccess(null);
    setIsSavingDetails(true);

    try {
      const res = await updateUserProfileDetailsAction({
        firstName,
        lastName,
        employeeId: employeeId.trim() || undefined,
      });

      if (!res.success) {
        setDetailsError(res.error || "Failed to update profile details.");
      } else {
        setDetailsSuccess("Your profile details were updated successfully!");
        router.refresh();
      }
    } catch {
      setDetailsError("A network error occurred while updating your profile.");
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Handle Password Update Form Submission (Triggers Auto-Logout)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const res = await updateUserPasswordAction({
        currentPassword: currentPassword || undefined,
        newPassword,
        confirmPassword,
      });

      if (!res.success) {
        setPasswordError(res.error || "Failed to update password.");
        setIsUpdatingPassword(false);
      } else {
        setPasswordSuccess("Password updated successfully! Logging you out across all sessions...");
        setTimeout(() => {
          router.push("/login?reason=password_changed");
        }, 1500);
      }
    } catch {
      setPasswordError("A network error occurred while updating your password.");
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Pill Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "details"
              ? "bg-white text-[#0F2962] shadow-sm font-extrabold"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "security"
              ? "bg-white text-[#0F2962] shadow-sm font-extrabold"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Change Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("signature")}
          className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "signature"
              ? "bg-white text-[#0F2962] shadow-sm font-extrabold"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <PenLine className="w-4 h-4" />
          <span>E-Signature</span>
        </button>
      </div>

      {/* TAB 1: PROFILE DETAILS FORM */}
      {activeTab === "details" && (
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/90 bg-white/90 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-base font-black text-slate-900">Personal & Employee Details</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Update your institutional identity records and employee ID designation.
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
            <div className="grid sm:grid-cols-2 gap-4">
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

            <div className="grid sm:grid-cols-2 gap-4">
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
                className="px-6 py-2.5 rounded-xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white text-xs font-extrabold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer hover:-translate-y-0.5 active:scale-98 disabled:opacity-50"
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
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/90 bg-white/90 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-base font-black text-slate-900">Change Institutional Password</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Ensure your account adheres to FAITH Colleges credential security guidelines.
            </p>
          </div>

          {/* Warning banner about automatic logout */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-medium flex items-start gap-3 shadow-xs">
            <LogOut className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-amber-900 block">Automatic Session Invalidation</strong>
              <span>
                Updating your password will immediately terminate your active session and log you out. You will be redirected to the sign-in page to log in with your new credentials.
              </span>
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter current institutional password"
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

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password (min. 8 characters)</label>
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
                className="px-6 py-2.5 rounded-xl bg-linear-to-r from-rose-700 to-rose-900 hover:from-rose-800 hover:to-rose-950 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer hover:-translate-y-0.5 active:scale-98 disabled:opacity-50"
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
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/90 bg-white/90 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-base font-black text-slate-900">Electronic Signature (Smart Anchor)</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Institutional electronic signatures are embedded via Smart Anchor detection on review approvals.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${hasSignature ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {hasSignature ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <PenLine className="w-6 h-6" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  {hasSignature ? "Electronic Signature Registered & Active" : "No Signature on File"}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                  {hasSignature
                    ? "Your signature image is encrypted in the private vault and will be automatically stamped when you approve documents."
                    : "Draw or upload your signature image to enable one-click document approvals."}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSignaturePadOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#0F2962] hover:bg-[#091a42] text-white text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-pointer shrink-0 hover:-translate-y-0.5 active:scale-98"
            >
              <PenLine className="w-4 h-4 text-amber-400" />
              <span>{hasSignature ? "Update Signature" : "Set Up Signature"}</span>
            </button>
          </div>

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
    </div>
  );
}