import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  GitBranch,
  ArrowRight,
  Lock,
  Building2,
  Users,
  CheckCircle2,
  Award,
  CheckCircle,
  HelpCircle,
  FileSignature,
  ShieldAlert,
  Clock,
  Compass,
  GraduationCap,
  HeartHandshake,
  Briefcase,
  Scale,
  Activity,
  ArrowUpRight,
} from "lucide-react";

export default function HomePage() {
  const sasUnits = [
    {
      code: "GCO",
      name: "Guidance & Counseling Office",
      icon: Compass,
      desc: "Confidential student intake profiles, psychological evaluations, graduation clearances, and counselor endorsement slips.",
      badge: "Confidentiality High",
      color: "from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/30",
    },
    {
      code: "AAPO",
      name: "Alumni Affairs & Placement Office",
      icon: GraduationCap,
      desc: "Industry MOA agreements, alumni tracer reports, graduate networking clearances, and institutional partnership charters.",
      badge: "Partnership MOAs",
      color: "from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/30",
    },
    {
      code: "SOA",
      name: "Student Organizations & Activities",
      icon: Users,
      desc: "Accreditation charters, campus activity proposals, off-campus event permits, and student council budget requisitions.",
      badge: "Event Permits",
      color: "from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/30",
    },
    {
      code: "SFA",
      name: "Scholarship & Financial Assistance",
      icon: Award,
      desc: "Academic grant applications, third-party sponsor MOAs, financial aid validation vouchers, and donor audit covenants.",
      badge: "Grants & Vouchers",
      color: "from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30",
    },
    {
      code: "DSW",
      name: "Discipline & Student Welfare",
      icon: Scale,
      desc: "Incident resolution logs, behavioral clearances, student handbook notices, and official inquiry proceedings.",
      badge: "Compliance Logs",
      color: "from-rose-500/20 to-rose-600/5 text-rose-400 border-rose-500/30",
    },
    {
      code: "CSIR",
      name: "Career Services & Industry Relations",
      icon: Briefcase,
      desc: "On-the-Job Training (OJT) memorandums, employer internship endorsements, student placement releases, and company profiles.",
      badge: "OJT Agreements",
      color: "from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/30",
    },
    {
      code: "CEE",
      name: "Community Engagement & Extension",
      icon: HeartHandshake,
      desc: "Community outreach agreements, barangay LGU permits, volunteer service records, and social responsibility accreditations.",
      badge: "Outreach Charters",
      color: "from-teal-500/20 to-teal-600/5 text-teal-400 border-teal-500/30",
    },
  ];

  const pillars = [
    {
      icon: FileSignature,
      title: "Smart Anchor E-Signatures",
      desc: "Automatically detects typed signatory markers and embeds cryptographically signed vector signatures above reviewer names without shifting margins.",
      tag: "Vector Stamp Engine",
    },
    {
      icon: GitBranch,
      title: "Zero-Overwrite Version Trees",
      desc: "Resubmissions never delete historic documents. Generates immutable version branches (v1.0 → v2.0) with exact revision summaries and checksum lineage.",
      tag: "Immutable Lineage",
    },
    {
      icon: ShieldAlert,
      title: "Automated Executive Escalation",
      desc: "Documents encountering 2 consecutive rejections or returns are immediately escalated to the Department Director for expedited intervention.",
      tag: "2-Rejection Trigger",
    },
    {
      icon: Lock,
      title: "Unit-Scoped RBAC Tenancy",
      desc: "Staff and Coordinators are strictly partitioned within their own Department Unit, ensuring cross-unit documents remain confidential.",
      tag: "Zero-Trust Isolation",
    },
    {
      icon: Clock,
      title: "Automated Expiry & Retention Cron",
      desc: "Vercel Cron workers check for expiring covenants, dispatching 30-day notifications and purging stale draft binaries per policy.",
      tag: "Automated Workers",
    },
    {
      icon: ShieldCheck,
      title: "RA 10173 Audit Stamping",
      desc: "Full Philippine Data Privacy Act compliance with real-time audit logging of every creation, approval, rejection, and download event.",
      tag: "National Compliance",
    },
  ];

  const workflowSteps = [
    {
      step: "01",
      title: "Ingestion & SHA-256 Hashing",
      desc: "Originating unit staff uploads the PDF or Office binary. The client computes a cryptographic SHA-256 checksum to register immutable file integrity before transmission.",
    },
    {
      step: "02",
      title: "Turn-Based Sequential Routing",
      desc: "The document advances through pre-assigned signatories (Unit Coordinator → Department Director) one turn at a time, preventing out-of-order execution.",
    },
    {
      step: "03",
      title: "Review & Electronic Signing",
      desc: "Active reviewers inspect the document in the split-screen viewer and apply their verified electronic signature with mandatory audit timestamps.",
    },
    {
      step: "04",
      title: "Cryptographic Seal & Preservation",
      desc: "Once all approvals are recorded, the document status transitions to APPROVED with immutable preservation lock and searchable audit trail.",
    },
  ];

  const faqs = [
    {
      q: "Who is authorized to access the SASDMS portal?",
      a: "Access is strictly restricted to verified employees, faculty coordinators, unit heads, and administrators of FAITH Colleges with valid @firstasia.edu.ph institutional email addresses.",
    },
    {
      q: "How does the system enforce electronic signature authenticity?",
      a: "Signatures are drawn or uploaded through our authenticated signature pad and cryptographically linked to the reviewer's user ID, IP address, and timestamp upon approval.",
    },
    {
      q: "What occurs when a reviewer returns a document for revision?",
      a: "The document returns to REJECTED_RETURNED status with required feedback comments. The uploader is prompted to upload version v2+ addressing the remarks, preserving full history.",
    },
    {
      q: "Is SASDMS compliant with Philippine data privacy laws?",
      a: "Yes. SASDMS complies with Republic Act 10173 (Data Privacy Act of 2012) through unit-level scoping, encrypted storage in Supabase private vaults, and comprehensive audit logs.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-amber-400 selection:text-slate-950 relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-125 bg-linear-to-tr from-blue-900/35 via-indigo-900/25 to-amber-500/10 blur-[130px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-150 right-0 w-150 h-150 bg-blue-950/40 blur-[140px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-300 left-0 w-120 h-120 bg-amber-500/5 blur-[150px] pointer-events-none -z-10 rounded-full" />

      {/* Top Floating Glass Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-[#0F2962] to-[#1E40AF] flex items-center justify-center text-amber-400 font-black text-xl shadow-lg shadow-blue-950/60 border border-blue-400/30">
              FA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-lg tracking-tight">
                  SASDMS
                </span>
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  Institutional Portal
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium block">
                FAITH Colleges • Student & Alumni Services
              </span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center space-x-7 text-xs font-bold text-slate-300">
            <a href="#workflow" className="hover:text-amber-400 transition-colors">
              Workflow Engine
            </a>
            <a href="#units" className="hover:text-amber-400 transition-colors">
              SAS Units
            </a>
            <a href="#architecture" className="hover:text-amber-400 transition-colors">
              Governance
            </a>
            <a href="#faq" className="hover:text-amber-400 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold text-slate-200 hover:text-white px-4 py-2.5 rounded-xl border border-slate-700/80 bg-slate-900/70 hover:bg-slate-800 transition duration-200"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs sm:text-sm text-slate-950 bg-linear-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 px-4.5 py-2.5 rounded-xl shadow-lg shadow-amber-400/20 hover:shadow-amber-400/30 transition-all duration-200 flex items-center gap-1.5 font-black transform active:scale-98"
            >
              <span>Staff Access</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-20">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left Hero Text */}
            <div className="lg:col-span-7 space-y-7 text-left">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-950/90 border border-blue-700/50 text-blue-300 text-xs font-bold shadow-inner">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Restricted Institutional Access • @firstasia.edu.ph</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-white">
                Institutional Document Governance &{" "}
                <span className="bg-linear-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent block mt-1">
                  Cryptographic Workflow Engine
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
                Engineered exclusively for the <strong>Student & Alumni Services (SAS)</strong> department at FAITH Colleges. Delivering zero-overwrite versioning, automated sequential approval chains, and verified electronic signatures.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/dashboard"
                  className="px-7 py-4 rounded-2xl bg-linear-to-r from-[#1E40AF] to-[#0F2962] hover:from-[#2563EB] hover:to-[#1E40AF] text-white font-black text-sm shadow-xl shadow-blue-900/40 border border-blue-400/30 transition-all duration-200 flex items-center gap-3 hover:-translate-y-0.5 active:scale-98"
                >
                  <Building2 className="w-4.5 h-4.5 text-amber-400" />
                  <span>Enter Staff Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-4 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-slate-500 text-slate-200 font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 backdrop-blur-md active:scale-98"
                >
                  Self-Registration & Verification
                </Link>
              </div>

              {/* Institutional Metrics Banner */}
              <div className="pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono block">7</span>
                  <span className="text-xs text-slate-400 font-medium">SAS Units Integrated</span>
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono block">100%</span>
                  <span className="text-xs text-slate-400 font-medium">SHA-256 Audited</span>
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono block">RA 10173</span>
                  <span className="text-xs text-slate-400 font-medium">Data Privacy Certified</span>
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-blue-400 font-mono block">Zero</span>
                  <span className="text-xs text-slate-400 font-medium">Paper Waste Protocol</span>
                </div>
              </div>
            </div>

            {/* Right Hero: Visual Interactive Document Card */}
            <div className="lg:col-span-5">
              <div className="glass-panel-dark rounded-3xl p-7 shadow-2xl border border-slate-700/70 space-y-6 relative overflow-hidden backdrop-blur-2xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Mockup Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-950 border border-blue-500/40 flex items-center justify-center text-amber-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-black text-blue-300 block">
                        DOC-SAS-2026-0842
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        AAPO • Industry MOA Partnership
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-950/90 text-amber-300 border border-amber-500/40 text-[10px] font-black flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Director Review
                  </span>
                </div>

                {/* Interactive Sequential Pipeline Stepper */}
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Sequential Approval Pipeline
                  </span>

                  {/* Step 1 */}
                  <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">1. Staff Ingestion (AAPO)</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">Passed</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        File verified with SHA-256 digest <code className="text-slate-300 font-mono">e3b0c442...</code>
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">2. Unit Coordinator Sign-off</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">Stamped</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Electronic signature stamped via Smart Anchor.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-blue-950/50 border border-blue-500/40 ring-2 ring-blue-500/20">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">3. Department Director Final</span>
                        <span className="text-[10px] font-mono text-blue-300 font-bold">Active Turn</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Awaiting executive validation and final institutional seal.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Footer Integrity Hash */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Cryptographic Anchor</span>
                    <span className="text-emerald-400">Lock Active</span>
                  </div>
                  <code className="text-[10px] font-mono text-slate-300 break-all block bg-black/40 p-2 rounded-xl border border-slate-800">
                    SHA-256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                  </code>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: SAS Department Units Ecosystem */}
        <section id="units" className="py-24 bg-slate-900/60 border-t border-slate-800/80 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-950 border border-blue-600/40 text-blue-300 text-xs font-bold shadow-inner">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Department Tenancy Matrix</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                7 Integrated SAS Department Units
              </h2>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
                Every unit in Student & Alumni Services operates with dedicated role permissions, specialized document taxonomies, and cross-unit visibility for the Department Director.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sasUnits.map((unit) => {
                const Icon = unit.icon;
                return (
                  <div
                    key={unit.code}
                    className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800/90 hover:border-slate-600 transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1 shadow-lg group"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className={`w-11 h-11 rounded-2xl bg-linear-to-br ${unit.color} border flex items-center justify-center shadow-md`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-mono text-xs font-black px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-amber-400">
                          {unit.code}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                          {unit.name}
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed mt-1.5">
                          {unit.desc}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>{unit.badge}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section: Architectural Pillars Bento Grid */}
        <section id="architecture" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/25 text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>Enterprise Rigor</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Engineered for Institutional Governance
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              A modern software architecture replacing vulnerable manual paperwork with cryptographic certainty.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="p-7 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 space-y-4 hover:-translate-y-1 shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-950/80 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-md">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">{p.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-full w-fit">
                    {p.tag}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section: Workflow Engine (Step-by-Step) */}
        <section id="workflow" className="py-24 bg-slate-900/60 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950 border border-emerald-600/40 text-emerald-300 text-xs font-bold">
                <Activity className="w-3.5 h-3.5" />
                <span>Life Cycle Protocol</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                How SAS Documents Progress to Full Approval
              </h2>
              <p className="text-sm sm:text-base text-slate-400">
                Four automated stages guaranteeing accountability at every touchpoint.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {workflowSteps.map((s) => (
                <div
                  key={s.step}
                  className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-3 relative overflow-hidden shadow-lg"
                >
                  <span className="text-3xl font-black font-mono text-slate-700 block">
                    {s.step}
                  </span>
                  <h3 className="text-base font-bold text-white">{s.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section: Institutional FAQ Accordion */}
        <section id="faq" className="py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-950 border border-blue-600/40 text-blue-300 text-xs font-bold">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Questions & Governance</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-2"
              >
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2.5">
                  <CheckCircle2 className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pl-7">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Conversion CTA Banner */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel-dark rounded-3xl p-8 sm:p-14 border border-blue-500/30 text-center space-y-6 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-linear-to-r from-blue-900/20 via-indigo-900/30 to-amber-500/10 pointer-events-none" />
            <div className="relative z-10 max-w-2xl mx-auto space-y-3">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Ready to Process or Sign SAS Documents?
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Log in with your authorized FAITH Colleges account to manage your review queue or submit new institutional covenants.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Link
                  href="/login"
                  className="px-7 py-3.5 rounded-2xl bg-linear-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-400/20 transition-all duration-200 flex items-center gap-2 transform active:scale-98"
                >
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-white font-bold text-sm shadow-md transition-all duration-200"
                >
                  Staff Registration
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Institutional Rich Footer */}
      <footer className="bg-slate-950 text-slate-400 py-14 text-xs border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#0F2962] text-amber-400 font-black flex items-center justify-center text-sm shadow-md border border-blue-500/30">
                FA
              </div>
              <div>
                <span className="font-black text-white text-sm block">
                  First Asia Institute of Technology and Humanities (FAITH Colleges)
                </span>
                <span className="text-slate-400 text-xs block">
                  Student & Alumni Services Document Management System (SASDMS)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6 font-bold text-slate-300">
              <Link href="/login" className="hover:text-amber-400 transition">
                Portal Login
              </Link>
              <Link href="/register" className="hover:text-amber-400 transition">
                Self-Registration
              </Link>
              <Link href="/dashboard" className="hover:text-amber-400 transition">
                Dashboard
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-medium">
            <p>
              © {new Date().getFullYear()} FAITH Colleges. All rights reserved. Republic Act 10173 (Data Privacy Act) Compliant.
            </p>
            <div className="flex items-center gap-4">
              <span>Tanauan City, Batangas, Philippines</span>
              <span>•</span>
              <span>SAS Institutional Records Vault</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
