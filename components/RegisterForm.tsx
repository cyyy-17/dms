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
  ShieldCheck,
} from "lucide-react";

interface UnitOption {
  id: string;
  code: string;
  name: string;
}

export default function RegisterForm({ units }: { units: UnitOption[] }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
        firstName,
        lastName,
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
    <div className="glass-panel rounded-3xl py-9 px-7 sm:px-11 shadow-2xl border border-white/80 backdrop-blur-2xl transition-all duration-300">
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50/90 border border-red-200/90 flex items-start gap-3 text-red-900 text-xs font-semibold shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <div className="mb-6 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-amber-950 text-xs shadow-xs">
        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-amber-900">Two-Stage Registration:</span> Accounts require subsequent Admin review and approval before activation. You will receive an email once activated.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              First Name
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                required
                placeholder="Juan"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="block w-full pl-9.5 pr-3 py-2.5 text-sm bg-white/90 border border-slate-300/90 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] focus:bg-white transition-all shadow-inner"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Last Name
            </label>
            <input
              type="text"
              required
              placeholder="Dela Cruz"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="block w-full px-3.5 py-2.5 text-sm bg-white/90 border border-slate-300/90 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] focus:bg-white transition-all shadow-inner"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
            Institutional Email (@firstasia.edu.ph)
          </label>
          <div className="relative rounded-xl shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              placeholder="jdelacruz@firstasia.edu.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-9.5 pr-3.5 py-2.5 text-sm bg-white/90 border border-slate-300/90 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] focus:bg-white transition-all shadow-inner"
            />
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-1.5 block">
            Domain is strictly enforced at application level before auth record creation.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Employee ID (Optional)
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <IdCard className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                placeholder="EMP-2026-081"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="block w-full pl-9.5 pr-3 py-2.5 text-sm bg-white/90 border border-slate-300/90 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] focus:bg-white transition-all shadow-inner"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Department Unit
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Building className="w-3.5 h-3.5" />
              </div>
              <select
                required
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="block w-full pl-9.5 pr-3 py-2.5 text-sm bg-white/90 border border-slate-300/90 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] focus:bg-white transition-all shadow-inner"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Min. 8 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-9.5 pr-9 py-2.5 text-sm bg-white/90 border border-slate-300/90 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] focus:bg-white transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full px-3.5 py-2.5 text-sm bg-white/90 border border-slate-300/90 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] focus:bg-white transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white font-bold text-sm shadow-lg shadow-blue-950/20 hover:shadow-xl hover:shadow-blue-950/30 transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-60 hover:-translate-y-0.5 active:scale-98 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Validating & Submitting...</span>
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

      <div className="mt-7 pt-5 border-t border-slate-200/80 text-center">
        <p className="text-xs text-slate-600 font-medium">
          Already registered?{" "}
          <Link href="/login" className="font-bold text-[#0F2962] hover:text-[#1E40AF] hover:underline transition ml-1">
            Sign In to Portal
          </Link>
        </p>
      </div>
    </div>
  );
}
