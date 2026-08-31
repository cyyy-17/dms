"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resetPasswordConfirmAction } from "@/actions/auth";
import {
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";

export default function ResetPasswordForm() {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password Strength Criteria Checks
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid = hasMinLength && hasUpper && hasLower && hasNumberOrSymbol && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasMinLength) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (!passwordsMatch) {
      setError("New password and confirmation do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await resetPasswordConfirmAction({
        newPassword,
        confirmPassword,
      });

      if (!res.success) {
        setError(res.error || "Failed to update password. Your reset link may have expired.");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login?reason=password_changed");
      }, 1500);
    } catch (err: unknown) {
      console.error("[RESET_PASSWORD_SUBMISSION_ERROR]", err);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl py-5 px-5 sm:py-6 sm:px-8 shadow-2xl bg-slate-900/85 border border-slate-800/90 backdrop-blur-2xl transition-all duration-300">
      {isSuccess ? (
        <div className="space-y-4 text-center py-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 flex items-center justify-center mx-auto shadow-md shadow-emerald-950/40">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-black text-white">Password Updated Successfully</h3>
            <p className="text-xs text-slate-300 font-medium">
              Your institutional password has been securely reset. Redirecting to sign in...
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-bold">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Opening Sign In Gateway...</span>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-3.5 p-3 rounded-xl bg-red-950/60 border border-red-500/40 flex items-start gap-2.5 text-red-300 text-xs font-semibold shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="block leading-tight">{error}</span>
                {error.toLowerCase().includes("expired") && (
                  <Link
                    href="/forgot-password"
                    className="inline-block text-[11px] text-amber-300 underline font-bold hover:text-amber-200 mt-0.5"
                  >
                    Request a new recovery link &rarr;
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="mb-3.5 p-2.5 rounded-xl bg-blue-950/50 border border-blue-500/30 flex items-start gap-2.5 text-blue-200 text-xs shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-tight text-[11.5px]">
              <span className="font-bold text-white">Institutional Security:</span> Create a strong password with at least 8 characters.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* New Password Input */}
            <div>
              <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full pl-10 pr-11 py-2.5 text-xs sm:text-sm bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded-lg cursor-pointer"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password Input */}
            <div>
              <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-11 py-2.5 text-xs sm:text-sm bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded-lg cursor-pointer"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements Checklist */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-[11px]">
              <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
                Password Requirements:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-400 font-semibold" : "text-slate-500"}`}>
                  {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? "text-emerald-400 font-semibold" : "text-slate-500"}`}>
                  {hasUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Uppercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? "text-emerald-400 font-semibold" : "text-slate-500"}`}>
                  {hasLower ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Lowercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumberOrSymbol ? "text-emerald-400 font-semibold" : "text-slate-500"}`}>
                  {hasNumberOrSymbol ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Number or symbol</span>
                </div>
              </div>
              {confirmPassword.length > 0 && (
                <div className={`pt-1 border-t border-slate-800/80 flex items-center gap-1.5 ${passwordsMatch ? "text-emerald-400 font-semibold" : "text-red-400"}`}>
                  {passwordsMatch ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>{passwordsMatch ? "Passwords match" : "Passwords do not match"}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-blue-700 via-[#0F2962] to-blue-800 hover:from-blue-600 hover:to-blue-700 text-white font-black text-xs shadow-lg shadow-blue-950/40 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 hover:-translate-y-0.5 active:scale-98 cursor-pointer ring-1 ring-blue-400/40"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Updating Credentials...</span>
                </>
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-3.5 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Want to sign in instead?{" "}
              <Link
                href="/login"
                className="font-bold text-amber-400 hover:text-amber-300 hover:underline transition ml-1 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded"
              >
                Sign In
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
