"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginEmployee } from "@/actions/auth";
import { Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, Loader2, ShieldCheck, CheckCircle2, Clock } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.endsWith("@firstasia.edu.ph")) {
      setError("Access is restricted strictly to official @firstasia.edu.ph institutional accounts.");
      setIsLoading(false);
      return;
    }

    try {
      // Authenticate and verify status via Server Action (handles cookies & RBAC)
      const res = await loginEmployee({ email: normalizedEmail, password });
      if (!res.success) {
        if (res.status === "PENDING_APPROVAL") {
          router.push("/pending-approval");
          return;
        }
        setError(res.error || "Invalid institutional email or password.");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      console.error("[LOGIN_PAGE_ERROR]", err);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during login.";
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl py-7 px-5 sm:py-9 sm:px-11 shadow-2xl border border-white/80 backdrop-blur-2xl transition-all duration-300">
      {reason === "password_changed" && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-start gap-3 text-emerald-950 text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">Your password has been changed successfully. Please sign in with your new credentials.</span>
        </div>
      )}

      {reason === "session_timeout" && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-amber-950 text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <span className="leading-relaxed">Your session expired due to inactivity. Please sign in again to continue.</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50/90 border border-red-200/90 flex items-start gap-3 text-red-900 text-xs font-semibold shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <div className="mb-6 p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-start gap-3 text-blue-950 text-xs shadow-xs">
        <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-blue-900">Institutional Access Only:</span> Log in with your registered{" "}
          <code className="font-mono text-blue-950 bg-blue-200/60 px-1.5 py-0.5 rounded-md font-bold text-[11px]">
            @firstasia.edu.ph
          </code>{" "}
          credentials.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
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
              className="block w-full pl-10 pr-3.5 py-3 text-base sm:text-sm bg-white/90 border border-slate-300/90 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] focus:bg-white transition-all shadow-inner"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Password
            </label>
          </div>
          <div className="relative rounded-xl shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-11 py-3 text-base sm:text-sm bg-white/90 border border-slate-300/90 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] focus:bg-white transition-all shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition focus-visible:ring-2 focus-visible:ring-[#0F2962] focus-visible:outline-none rounded-lg"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white font-bold text-sm shadow-lg shadow-blue-950/20 hover:shadow-xl hover:shadow-blue-950/30 transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-60 hover:-translate-y-0.5 active:scale-98 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Verifying credentials...</span>
            </>
          ) : (
            <>
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </>
          )}
        </button>
      </form>

      <div className="mt-7 pt-6 border-t border-slate-200/80 text-center">
        <p className="text-xs text-slate-600 font-medium">
          Not yet registered in the system?{" "}
          <Link
            href="/register"
            className="font-bold text-[#0F2962] hover:text-[#1E40AF] hover:underline transition ml-1 focus-visible:ring-2 focus-visible:ring-[#0F2962] focus-visible:outline-none rounded"
          >
            Register for Staff Approval
          </Link>
        </p>
      </div>
    </div>
  );
}
