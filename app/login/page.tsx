"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { loginEmployee } from "@/actions/auth";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.endsWith("@firstasia.edu.ph")) {
      setError("Access is restricted to official @firstasia.edu.ph institutional accounts.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Direct Browser Session Initialization
      const supabase = createBrowserSupabase();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (authError) {
        setError(authError.message || "Invalid email or password.");
        setIsLoading(false);
        return;
      }

      // 2. Server Profile & RBAC Verification
      const res = await loginEmployee({ email: normalizedEmail, password });
      if (!res.success) {
        if (res.status === "PENDING_APPROVAL") {
          router.push("/pending-approval");
          return;
        }
        setError(res.error || "Failed to log in.");
        setIsLoading(false);
        return;
      }

      // 3. Navigate to Dashboard
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2">
          <div className="w-12 h-12 rounded-xl bg-[#0F2962] flex items-center justify-center text-amber-400 font-bold text-xl shadow-md">
            FA
          </div>
        </Link>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
          SASDMS Employee Login
        </h1>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Student & Alumni Services • First Asia Institute of Technology and Humanities
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="glass-card rounded-2xl py-8 px-6 sm:px-10 shadow-xl border border-slate-200">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="mb-6 p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 flex items-start gap-2.5 text-blue-900 text-xs">
            <Lock className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Institutional Access Only:</span> Log in using your registered{" "}
              <code className="font-mono text-blue-800 bg-blue-100/80 px-1 py-0.5 rounded font-bold">
                @firstasia.edu.ph
              </code>{" "}
              account credentials.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Institutional Email
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="username@firstasia.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#0F2962] hover:bg-[#091a42] text-white font-semibold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-600">
              Need access or not yet registered?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#0F2962] hover:underline"
              >
                Register for Staff Approval
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
