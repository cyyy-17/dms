import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  GitBranch,
  Clock,
  ArrowRight,
  Lock,
  Building2,
  Users,
  CheckCircle2,
  Fingerprint,
  Sparkles,
  Award,
  Layers,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-amber-400 selection:text-slate-950 relative overflow-x-hidden">
      {/* Dynamic Background Mesh Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-blue-900/30 via-indigo-900/20 to-amber-500/10 blur-[130px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-[600px] right-0 w-[600px] h-[600px] bg-blue-950/40 blur-[140px] pointer-events-none -z-10 rounded-full" />

      {/* Top Floating Glass Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/75 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0F2962] to-[#1E40AF] flex items-center justify-center text-amber-400 font-black text-xl shadow-lg shadow-blue-950/60 border border-blue-400/30">
              FA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-lg tracking-tight">
                  SASDMS
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                  Enterprise
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium block">
                FAITH Colleges • Student & Alumni Services
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-xl hover:bg-slate-800/60 transition duration-200"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs sm:text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 px-4.5 py-2.5 rounded-xl shadow-lg shadow-amber-400/20 hover:shadow-amber-400/30 transition-all duration-200 flex items-center gap-1.5 font-bold transform active:scale-98"
            >
              <span>Staff Registration</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-16">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left Column: Hero Text */}
            <div className="lg:col-span-7 space-y-7 text-left">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-700/40 text-blue-300 text-xs font-semibold shadow-inner">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Restricted Institutional Access • @firstasia.edu.ph</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
                Student & Alumni Services{" "}
                <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent block mt-1">
                  Document Management Portal
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
                An institutional workflow engine with zero-overwrite versioning, cryptographic checksum auditing, and automated sequential review chains engineered exclusively for FAITH Colleges.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/dashboard"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#0F2962] hover:from-[#2563EB] hover:to-[#1E40AF] text-white font-bold text-sm shadow-xl shadow-blue-900/40 border border-blue-400/30 transition-all duration-200 flex items-center gap-2.5 hover:-translate-y-0.5 active:scale-98"
                >
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Enter Staff Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-3.5 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-slate-500 text-slate-200 font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 backdrop-blur-md active:scale-98"
                >
                  Self-Registration & Approval
                </Link>
              </div>

              {/* Compliance Badges */}
              <div className="pt-8 border-t border-slate-800/80 grid grid-cols-3 gap-4 sm:gap-6">
                <div className="flex items-center gap-2.5 text-slate-300 text-xs font-semibold">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-white">RA 10173</span>
                    <span className="text-[11px] text-slate-400 font-normal">Data Privacy</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-slate-300 text-xs font-semibold">
                  <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-white">SHA-256</span>
                    <span className="text-[11px] text-slate-400 font-normal">Immutable Audit</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-slate-300 text-xs font-semibold">
                  <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-white">E-Signatures</span>
                    <span className="text-[11px] text-slate-400 font-normal">Legal Stamping</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Interactive Glass Workflow Card */}
            <div className="lg:col-span-5">
              <div className="glass-panel-dark rounded-3xl p-7 shadow-2xl border border-slate-700/60 space-y-6 relative overflow-hidden backdrop-blur-2xl">
                {/* Subtle Inner Glow Highlight */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Sequential Approval Pipeline
                    </span>
                  </div>
                  <span className="text-[11px] bg-emerald-950/80 text-emerald-400 px-2.5 py-1 rounded-full font-bold border border-emerald-500/40 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Live Protocol
                  </span>
                </div>

                {/* Step 1: Staff */}
                <div className="flex items-start gap-4 group">
                  <div className="w-9 h-9 rounded-xl bg-blue-900/60 border border-blue-500/40 text-blue-300 font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                    1
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-white">Unit Staff Submission</h2>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                        v1.0
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Uploads initial document with metadata tagging, automatic SHA-256 digest, and target unit designation.
                    </p>
                  </div>
                </div>

                <div className="w-0.5 h-4 bg-gradient-to-b from-blue-500 to-amber-500 ml-4 rounded-full" />

                {/* Step 2: Coordinator */}
                <div className="flex items-start gap-4 group">
                  <div className="w-9 h-9 rounded-xl bg-amber-900/60 border border-amber-500/40 text-amber-300 font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                    2
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-white">Unit Coordinator Review</h2>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                        Step 1
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      First-tier review: Approve & apply cryptographic e-signature, or return with line-item feedback.
                    </p>
                  </div>
                </div>

                <div className="w-0.5 h-4 bg-gradient-to-b from-amber-500 to-purple-500 ml-4 rounded-full" />

                {/* Step 3: Director */}
                <div className="flex items-start gap-4 group">
                  <div className="w-9 h-9 rounded-xl bg-purple-900/60 border border-purple-500/40 text-purple-300 font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                    3
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-white">Department Director Approval</h2>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                        Final
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Executive validation and institutional sign-off for DIRECTOR_REQUIRED types and escalated workflows.
                    </p>
                  </div>
                </div>

                {/* Card Footer Banner */}
                <div className="pt-4 border-t border-slate-800/80 bg-slate-900/60 -mx-7 -mb-7 p-4 rounded-b-3xl">
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>2 consecutive rejections automatically escalate document visibility to Director.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid Section */}
        <section className="bg-slate-900/60 border-t border-slate-800/80 py-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 text-xs font-bold">
                <Award className="w-3.5 h-3.5" />
                <span>Enterprise Architecture</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Designed for Operational Rigor & Complete Auditability
              </h2>
              <p className="text-sm sm:text-base text-slate-400">
                A unified compliance framework tailored to the academic administration requirements of FAITH Colleges.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-7 rounded-3xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 space-y-4 hover:-translate-y-1 shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-blue-950 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Zero-Overwrite Versioning</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Resubmissions automatically branch into immutable version trees with distinct checksums, preservation logs, and complete diff summaries.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-7 rounded-3xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 space-y-4 hover:-translate-y-1 shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Unit-Scoped Role Security</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Strict tenancy boundaries for Staff and Coordinators within their respective units, with cross-unit oversight for Executive roles.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-7 rounded-3xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 space-y-4 hover:-translate-y-1 shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Automated Cron Pipeline</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Background notification workers, expiry countdown warnings, and retention cleanups powered by resilient Vercel Cron endpoints.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-10 text-xs border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#0F2962] text-amber-400 font-bold flex items-center justify-center text-xs">
              FA
            </div>
            <div>
              <span className="font-bold text-white">First Asia Institute of Technology and Humanities</span>
              <span className="block text-slate-400">Student & Alumni Services Document Management System</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-slate-400">
            <span>RA 10173 Compliant</span>
            <span>Institutional Use Only</span>
            <span>© {new Date().getFullYear()} FAITH Colleges</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
