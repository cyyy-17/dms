"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginEmployee } from "@/actions/auth";
import { isValidInstitutionalEmail } from "@/lib/constants";
import { Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, Loader2, ShieldCheck, CheckCircle2, Clock } from "lucide-react";
import AuthGatewayTransition from "@/components/AuthGatewayTransition";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authUserData, setAuthUserData] = useState<{
    firstName: string;
    lastName: string;
    role: string;
    unitCode: string | null;
    unitName: string | null;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidInstitutionalEmail(normalizedEmail)) {
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

      if (res.user) {
        setAuthUserData(res.user);
        router.push("/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      console.error("[LOGIN_PAGE_ERROR]", err);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during login.";
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl py-5 px-5 sm:py-6 sm:px-8 shadow-2xl bg-slate-900/85 border border-slate-800/90 backdrop-blur-2xl transition-all duration-300">
      {(reason === "password_changed" || reason === "password_updated") && (
        <div className="mb-3.5 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-start gap-2.5 text-emerald-300 text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-tight">Password reset successfully. Please sign in with your new credentials.</span>
        </div>
      )}

      {reason === "session_timeout" && (
        <div className="mb-3.5 p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-start gap-2.5 text-amber-300 text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span className="leading-tight">Session expired due to inactivity. Please sign in again.</span>
        </div>
      )}

      {error && (
        <div className="mb-3.5 p-3 rounded-xl bg-red-950/60 border border-red-500/40 flex items-start gap-2.5 text-red-300 text-xs font-semibold shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span className="leading-tight">{error}</span>
        </div>
      )}

      <div className="mb-3.5 p-2.5 rounded-xl bg-blue-950/50 border border-blue-500/30 flex items-start gap-2.5 text-blue-200 text-xs shadow-xs">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="leading-tight text-[11.5px]">
          <span className="font-bold text-white">Institutional Access:</span> Sign in with official{" "}
          <code className="font-mono text-amber-300 bg-blue-900/60 border border-blue-400/30 px-1 py-0.5 rounded font-bold text-[10.5px]">
            @firstasia.edu.ph
          </code>{" "}
          account.
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:underline transition focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded"
            >
              Forgot password?
            </Link>
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
              className="block w-full pl-10 pr-11 py-2.5 text-xs sm:text-sm bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded-lg cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
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
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </>
          )}
        </button>
      </form>

      <div className="mt-4 pt-3.5 border-t border-slate-800/80 text-center">
        <p className="text-xs text-slate-400 font-medium">
          Don&apos;t have an account yet?{" "}
          <Link
            href="/register"
            className="font-bold text-amber-400 hover:text-amber-300 hover:underline transition ml-1 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded"
          >
            Create an Account
          </Link>
        </p>
      </div>

      {authUserData && (
        <AuthGatewayTransition
          user={authUserData}
          onComplete={() => {
            router.push("/dashboard");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
