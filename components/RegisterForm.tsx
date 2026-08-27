"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerEmployee } from "@/actions/auth";
import {
  Lock,
  Mail,
  User,
  Building,
  IdCard,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

interface UnitOption {
  id: string;
  code: string;
  name: string;
}

export default function RegisterForm({ units }: { units: UnitOption[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [unitId, setUnitId] = useState(units[0]?.id || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Client-Side Domain Check
    if (!email.trim().toLowerCase().endsWith("@firstasia.edu.ph")) {
      setError("Registration is strictly restricted to @firstasia.edu.ph institutional email addresses.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registerEmployee({
        title: title.trim() || undefined,
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim(),
        suffix: suffix.trim() || undefined,
        email,
        employeeId,
        unitId,
        password,
      });

      if (!res.success) {
        setError(res.error || "Registration failed. Please check your details.");
        setIsSubmitting(false);
        return;
      }

      router.push("/pending-approval?registered=true");
    } catch {
      setError("A network error occurred while submitting registration.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl py-4 px-4 sm:py-5 sm:px-7 shadow-2xl bg-slate-900/85 border border-slate-800/90 backdrop-blur-2xl transition-all duration-300">
      {error && (
        <div className="mb-2.5 p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 flex items-start gap-2 text-red-300 text-xs font-semibold shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span className="leading-tight">{error}</span>
        </div>
      )}

      <div className="mb-2.5 p-2 rounded-xl bg-amber-950/50 border border-amber-500/30 flex items-start gap-2 text-amber-200 text-[11px] shadow-xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-tight">
          <span className="font-bold text-white">Two-Stage Registration:</span> Accounts require subsequent Admin review and approval before activation.
        </div>
      </div>

      {(() => {
        const hasValidEmail = email.trim().endsWith("@firstasia.edu.ph");
        const hasNames = firstName.trim().length > 0 && lastName.trim().length > 0;
        const hasValidPassword = password.length >= 8 && confirmPassword === password && confirmPassword.length > 0;
        const fields = [hasNames, hasValidEmail, hasValidPassword];
        const completed = fields.filter(Boolean).length;
        const percent = Math.round((completed / 3) * 100);

        return (
          <div className="mb-3 p-2 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1 shadow-inner">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span className="uppercase font-mono tracking-wider">Form Completion</span>
              <span className="text-amber-400 font-mono">{percent}%</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-blue-600 via-[#0F2962] to-amber-400 transition-all duration-300"
                style={{ width: `${Math.max(percent, 10)}%` }}
              />
            </div>
          </div>
        );
      })()}

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {/* Name Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="block text-[10.5px] font-black text-slate-300 uppercase tracking-wider mb-1">
              Title (Opt.)
            </label>
            <input
              type="text"
              placeholder="Ms. / Dr. / Engr."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full px-2.5 py-1.5 text-xs bg-slate-950/80 border border-slate-700/80 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10.5px] font-black text-slate-300 uppercase tracking-wider mb-1">
              First Name
            </label>
            <div className="relative rounded-lg shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                required
                placeholder="Juan"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="block w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-950/80 border border-slate-700/80 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="block text-[10.5px] font-black text-slate-300 uppercase tracking-wider mb-1">
              Middle Name / M.I.
            </label>
            <input
              type="text"
              placeholder="R. / Mae"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className="block w-full px-2.5 py-1.5 text-xs bg-slate-950/80 border border-slate-700/80 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
            />
          </div>
          <div>
            <label className="block text-[10.5px] font-black text-slate-300 uppercase tracking-wider mb-1">
              Last Name
            </label>
            <input
              type="text"
              required
              placeholder="Dela Cruz"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="block w-full px-2.5 py-1.5 text-xs bg-slate-950/80 border border-slate-700/80 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
            />
          </div>
          <div>
            <label className="block text-[10.5px] font-black text-slate-300 uppercase tracking-wider mb-1">
              Suffix (Opt.)
            </label>
            <input
              type="text"
              placeholder="Jr. / PhD / III"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              className="block w-full px-2.5 py-1.5 text-xs bg-slate-950/80 border border-slate-700/80 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[10.5px] font-black text-slate-300 uppercase tracking-wider mb-1">
              Institutional Email
            </label>
            <div className="relative rounded-lg shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <input
                type="email"
                required
                placeholder="jdelacruz@firstasia.edu.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-950/80 border border-slate-700/80 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10.5px] font-black text-slate-300 uppercase tracking-wider mb-1">
              Employee ID (Opt.)
            </label>
            <div className="relative rounded-lg shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <IdCard className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                placeholder="EMP-2026-081"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="block w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-950/80 border border-slate-700/80 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10.5px] font-black text-slate-300 uppercase tracking-wider mb-1">
            Department Unit
          </label>
          <div className="relative rounded-lg shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Building className="w-3.5 h-3.5" />
            </div>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="block w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-950/80 border border-slate-700/80 rounded-lg text-white focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
            >
              {units.length > 0 ? (
                units.map((u) => (
                  <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                    {u.name} ({u.code})
                  </option>
                ))
              ) : (
                <option value="" className="bg-slate-900 text-white">
                  General / Unassigned (Designated by Admin)
                </option>
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[10.5px] font-black text-slate-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative rounded-lg shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Min. 8 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-8 pr-8 py-1.5 text-xs bg-slate-950/80 border border-slate-700/80 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[10.5px] font-black text-slate-300 uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full px-2.5 py-1.5 text-xs bg-slate-950/80 border border-slate-700/80 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="pt-1.5">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-linear-to-r from-blue-700 via-[#0F2962] to-blue-800 hover:from-blue-600 hover:to-blue-700 text-white font-black text-xs shadow-lg shadow-blue-950/40 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 hover:-translate-y-0.5 active:scale-98 cursor-pointer ring-1 ring-blue-400/40"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <span>Submit Registration</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-center">
        <p className="text-xs text-slate-400 font-medium">
          Already registered?{" "}
          <Link href="/login" className="font-bold text-amber-400 hover:text-amber-300 hover:underline transition ml-1">
            Sign In to Portal
          </Link>
        </p>
      </div>
    </div>
  );
}
