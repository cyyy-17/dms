"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { requestPasswordResetAction } from "@/actions/auth";
import {
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  RotateCcw,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const initialError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewLink, setPreviewLink] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.endsWith("@firstasia.edu.ph")) {
      setError("Password reset is restricted strictly to official @firstasia.edu.ph institutional accounts.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await requestPasswordResetAction(normalizedEmail);
      setIsLoading(false);

      if (res.success) {
        setIsSuccess(true);
        setSuccessMessage(
          res.message ||
            "If an active account exists for this email, a password reset link has been dispatched to your inbox."
        );
        if (res.previewLink) {
          setPreviewLink(res.previewLink);
        }
        setCooldown(60);
      } else {
        setError(res.error || "Failed to process password reset request.");
      }
    } catch (err: unknown) {
      console.error("[FORGOT_PASSWORD_ERROR]", err);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      const res = await requestPasswordResetAction(email.trim().toLowerCase());
      setIsLoading(false);

      if (res.success) {
        setCooldown(60);
        if (res.previewLink) {
          setPreviewLink(res.previewLink);
        }
      } else {
        setError(res.error || "Failed to resend reset link.");
      }
    } catch {
      setIsLoading(false);
      setError("Failed to resend reset link.");
    }
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl py-5 px-5 sm:py-6 sm:px-8 shadow-2xl bg-slate-900/85 border border-slate-800/90 backdrop-blur-2xl transition-all duration-300">
      {error && (
        <div className="mb-3.5 p-3 rounded-xl bg-red-950/60 border border-red-500/40 flex items-start gap-2.5 text-red-300 text-xs font-semibold shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span className="leading-tight">{error}</span>
        </div>
      )}

      {isSuccess ? (
        <div className="space-y-4 text-center py-2 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 flex items-center justify-center mx-auto shadow-md shadow-emerald-950/40">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-black text-white">Check Your Institutional Inbox</h3>
            <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-sm mx-auto">
              {successMessage}
            </p>
            <p className="text-[11.5px] font-mono text-amber-300 font-bold bg-slate-950/80 border border-slate-800 py-1.5 px-3 rounded-xl inline-block mt-1">
              {email}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/20 text-left flex items-start gap-2.5 text-xs text-blue-200">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Security Notice:</strong> The recovery link is valid for <strong>15 minutes</strong>. If you do not see the email within 2 minutes, please verify your spam or institutional quarantine folder.
            </div>
          </div>

          {previewLink && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-left space-y-1.5">
              <span className="text-[10px] uppercase font-mono font-bold text-amber-400 block tracking-wider">
                Development Preview Active
              </span>
              <Link
                href={previewLink}
                className="text-xs text-amber-300 hover:text-amber-200 underline font-mono break-all inline-flex items-center gap-1.5"
              >
                <span>Direct Reset Link</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </Link>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isLoading}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Link"}</span>
            </button>

            <Link
              href="/login"
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-linear-to-r from-blue-700 via-[#0F2962] to-blue-800 text-white text-xs font-bold hover:brightness-110 transition flex items-center justify-center gap-1.5 shadow-md"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Return to Sign In</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3.5 p-2.5 rounded-xl bg-blue-950/50 border border-blue-500/30 flex items-start gap-2.5 text-blue-200 text-xs shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-tight text-[11.5px]">
              <span className="font-bold text-white">Zero-Trust Recovery:</span> Enter your registered{" "}
              <code className="font-mono text-amber-300 bg-blue-900/60 border border-blue-400/30 px-1 py-0.5 rounded font-bold text-[10.5px]">
                @firstasia.edu.ph
              </code>{" "}
              address to receive a secure, one-time reset link.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider mb-1.5">
                Institutional Email
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="username@firstasia.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-blue-700 via-[#0F2962] to-blue-800 hover:from-blue-600 hover:to-blue-700 text-white font-black text-xs shadow-lg shadow-blue-950/40 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 hover:-translate-y-0.5 active:scale-98 cursor-pointer ring-1 ring-blue-400/40"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Dispatching Reset Link...</span>
                </>
              ) : (
                <>
                  <span>Send Recovery Email</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-3.5 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Remember your password?{" "}
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
