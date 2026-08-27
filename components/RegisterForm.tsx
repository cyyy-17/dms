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
  ArrowLeft,
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  // Step 1: Personal Details
  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");

  // Step 2: Institutional Affiliation
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [unitId, setUnitId] = useState(units[0]?.id || "");

  // Step 3: Security & Access
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please provide both your First Name and Last Name.");
      return;
    }
    setDirection("forward");
    setStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith("@firstasia.edu.ph")) {
      setError("Registration is strictly restricted to @firstasia.edu.ph institutional email addresses.");
      return;
    }
    setDirection("forward");
    setStep(3);
  };

  const handleBack = () => {
    setError(null);
    setDirection("backward");
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : 1));
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
        employeeId: employeeId.trim() || undefined,
        unitId: unitId || "",
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
    <div className="rounded-2xl sm:rounded-3xl py-4.5 px-4.5 sm:py-5 sm:px-7 shadow-2xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-2xl transition-all duration-300">
      {/* 📊 Interactive 3-Stage Progress Indicator */}
      <div className="mb-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10.5px] font-mono font-bold border border-blue-400/30 shadow-xs">
              Step {step} of 3
            </span>
            <span className="text-xs font-black text-white">
              {step === 1 && "Personal Identification"}
              {step === 2 && "Institutional Affiliation"}
              {step === 3 && "Security Credentials"}
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-amber-400">
            {step === 1 ? "33%" : step === 2 ? "66%" : "100%"}
          </span>
        </div>

        {/* 3 Step Track Bars */}
        <div className="grid grid-cols-3 gap-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${
              step >= 1 ? "bg-amber-400 shadow-xs shadow-amber-400/50" : "bg-slate-800"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${
              step >= 2 ? "bg-amber-400 shadow-xs shadow-amber-400/50" : "bg-slate-800"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${
              step >= 3 ? "bg-emerald-400 shadow-xs shadow-emerald-400/50" : "bg-slate-800"
            }`}
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-3 p-2.5 rounded-xl bg-red-950/70 border border-red-500/40 flex items-start gap-2 text-red-300 text-xs font-semibold shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span className="leading-tight">{error}</span>
        </div>
      )}

      {/* STEP 1: Personal Identification */}
      {step === 1 && (
        <form
          onSubmit={handleStep1Next}
          key="step-1"
          className={`space-y-3 animate-in fade-in ${
            direction === "forward" ? "slide-in-from-right-4" : "slide-in-from-left-4"
          } duration-200`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10.5px] font-black text-slate-300 uppercase tracking-wider mb-1">
                Title (Opt.)
              </label>
              <input
                type="text"
                placeholder="Ms. / Dr."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10.5px] font-black text-slate-300 uppercase tracking-wider mb-1">
                First Name <span className="text-amber-400">*</span>
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10.5px] font-black text-slate-300 uppercase tracking-wider mb-1">
                Middle Name / M.I.
              </label>
              <input
                type="text"
                placeholder="R. / Mae"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="block w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-black text-slate-300 uppercase tracking-wider mb-1">
                Last Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Dela Cruz"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="block w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-black text-slate-300 uppercase tracking-wider mb-1">
                Suffix (Opt.)
              </label>
              <input
                type="text"
                placeholder="Jr. / PhD"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                className="block w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-linear-to-r from-blue-700 via-[#0F2962] to-blue-800 hover:from-blue-600 hover:to-blue-700 text-white font-black text-xs shadow-lg shadow-blue-950/40 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-98 cursor-pointer ring-1 ring-blue-400/40"
            >
              <span>Continue to Institutional Details</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Institutional Affiliation */}
      {step === 2 && (
        <form
          onSubmit={handleStep2Next}
          key="step-2"
          className={`space-y-3 animate-in fade-in ${
            direction === "forward" ? "slide-in-from-right-4" : "slide-in-from-left-4"
          } duration-200`}
        >
          <div>
            <label className="block text-[10.5px] font-black text-slate-300 uppercase tracking-wider mb-1">
              Institutional Email <span className="text-amber-400">*</span>
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <input
                type="email"
                required
                placeholder="jdelacruz@firstasia.edu.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Domain restricted strictly to <code className="text-amber-400 font-mono">@firstasia.edu.ph</code>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10.5px] font-black text-slate-300 uppercase tracking-wider mb-1">
                Employee ID (Opt.)
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <IdCard className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  placeholder="EMP-2026-081"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-black text-slate-300 uppercase tracking-wider mb-1">
                Department Unit
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building className="w-3.5 h-3.5" />
                </div>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl text-white focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
                >
                  {units.length > 0 ? (
                    units.map((u) => (
                      <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                        {u.name} ({u.code})
                      </option>
                    ))
                  ) : (
                    <option value="" className="bg-slate-900 text-white">
                      General / Designated by Admin
                    </option>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleBack}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              className="py-2.5 px-3 rounded-xl bg-linear-to-r from-blue-700 via-[#0F2962] to-blue-800 hover:from-blue-600 hover:to-blue-700 text-white font-black text-xs shadow-lg shadow-blue-950/40 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ring-1 ring-blue-400/40"
            >
              <span>Security Access</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Security & Credentials */}
      {step === 3 && (
        <form
          onSubmit={handleFinalSubmit}
          key="step-3"
          className={`space-y-3 animate-in fade-in ${
            direction === "forward" ? "slide-in-from-right-4" : "slide-in-from-left-4"
          } duration-200`}
        >
          <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-2 text-amber-200 text-[10.5px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>Two-Stage Workflow: Account requires Admin approval before portal access is unlocked.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10.5px] font-black text-slate-300 uppercase tracking-wider mb-1">
                Password <span className="text-amber-400">*</span>
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Min. 8 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-8 py-2 text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
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
                Confirm Password <span className="text-amber-400">*</span>
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-slate-950 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-3 rounded-xl bg-linear-to-r from-emerald-600 via-teal-700 to-emerald-800 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs shadow-lg shadow-emerald-950/40 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ring-1 ring-emerald-400/40 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>Complete Sign Up</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Footer Return Link */}
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
