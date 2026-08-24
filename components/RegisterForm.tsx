"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerEmployee } from "@/actions/auth";
import { Lock, Mail, User, Building, IdCard, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

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

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Client-Side Domain Check
    if (!email.trim().toLowerCase().endsWith("@firstasia.edu.ph")) {
      setError("Registration is strictly restricted to @firstasia.edu.ph email addresses.");
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
    <div className="glass-card rounded-2xl py-8 px-6 sm:px-10 shadow-xl border border-slate-200">
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-6 p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5 text-amber-900 text-xs">
        <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Two-Stage Registration:</span> Accounts require subsequent Admin review and approval before activation. You will receive an email once activated.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              First Name
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                required
                placeholder="Juan"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="block w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Last Name
            </label>
            <input
              type="text"
              required
              placeholder="Dela Cruz"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Institutional Email (@firstasia.edu.ph)
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              placeholder="jdelacruz@firstasia.edu.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition bg-white"
            />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Domain is strictly enforced at application level before auth record creation.
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Employee ID (Optional)
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <IdCard className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                placeholder="EMP-2026-081"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="block w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Department Unit
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Building className="w-3.5 h-3.5" />
              </div>
              <select
                required
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="block w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition bg-white"
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                type="password"
                required
                placeholder="Min. 8 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              required
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition bg-white"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-lg bg-[#0F2962] hover:bg-[#091a42] text-white font-semibold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Validating & Submitting...</span>
            ) : (
              <>
                <span>Submit Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-600">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-[#0F2962] hover:underline">
            Sign In to Portal
          </Link>
        </p>
      </div>
    </div>
  );
}
