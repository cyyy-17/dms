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
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#0F2962] flex items-center justify-center text-amber-400 font-bold text-lg shadow-sm">
              FA
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg tracking-tight block">
                SASDMS
              </span>
              <span className="text-xs text-slate-500 font-medium block">
                FAITH Colleges • Student & Alumni Services
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 hover:text-[#0F2962] px-4 py-2 rounded-lg transition"
            >
              Employee Login
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold text-white bg-[#0F2962] hover:bg-[#091a42] px-4 py-2 rounded-lg shadow-sm hover:shadow transition flex items-center gap-1.5"
            >
              <span>Register Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Internal Department System • @firstasia.edu.ph Only</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Student & Alumni Services{" "}
                <span className="text-[#0F2962] block">Document Management System</span>
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
                A secure, sequential approval and immutable document repository engineered
                exclusively for the internal operations of First Asia Institute of Technology
                and Humanities (FAITH Colleges).
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/dashboard"
                  className="px-6 py-3 rounded-xl bg-[#0F2962] hover:bg-[#091a42] text-white font-semibold text-sm shadow-md hover:shadow-lg transition flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Enter Staff Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-3 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-sm shadow-sm hover:shadow transition"
                >
                  Self-Registration & Activation
                </Link>
              </div>

              {/* Compliance & Security Badges */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>RA 10173 Aligned</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                  <GitBranch className="w-4 h-4 text-blue-600" />
                  <span>Immutable Versioning</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Vercel Cron Alerts</span>
                </div>
              </div>
            </div>

            {/* Visual Workflow Preview Card */}
            <div className="lg:col-span-5">
              <div className="glass-card rounded-2xl p-6 shadow-xl border border-slate-200/80 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Sequential Approval Chain
                  </span>
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                    Active Workflow
                  </span>
                </div>

                {/* Step 1: Staff */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0F2962] font-bold text-sm flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Unit Staff Submission</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Uploads initial document (v1) with SHA-256 checksum and metadata.
                    </p>
                  </div>
                </div>

                <div className="w-0.5 h-4 bg-slate-200 ml-4"></div>

                {/* Step 2: Coordinator */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-sm flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Unit Coordinator Review</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      First-level review: Approve (terminal if COORDINATOR_ONLY) or return with feedback.
                    </p>
                  </div>
                </div>

                <div className="w-0.5 h-4 bg-slate-200 ml-4"></div>

                {/* Step 3: Director */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 font-bold text-sm flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Department Director Approval</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Final executive sign-off for DIRECTOR_REQUIRED document types and auto-escalated reviews.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-2xl">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Rejections return document for rework; 2 rejections trigger automatic Director visibility.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <section className="bg-white border-t border-slate-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Engineered for Rigorous Compliance & Efficiency
              </h2>
              <p className="text-sm sm:text-base text-slate-500 mt-2">
                Built specifically around the operational requirements of Student & Alumni Services at FAITH Colleges.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Zero-Overwrite Versioning</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Every resubmission creates a new immutable version record and storage object. Audit trails capture every change summary and byte-level checksum.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-300 transition space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Unit-Scoped Role Security</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Strict boundary isolation for Staff and Coordinators within their respective units, with cross-unit oversight for Director and Admin.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Async Notification Queue</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Resend email notifications are queued asynchronously and dispatched by Vercel Cron with exponential retry backoff and delivery status tracking.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0B1B3D] text-slate-400 py-8 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-white">First Asia Institute of Technology and Humanities</span>
            <span className="block mt-0.5 text-slate-400">Student & Alumni Services Document Management System (SASDMS)</span>
          </div>
          <div className="flex items-center gap-6">
            <span>RA 10173 Compliant</span>
            <span>Internal Employees Only</span>
            <span>© {new Date().getFullYear()} FAITH Colleges</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
