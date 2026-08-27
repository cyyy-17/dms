import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import LandingNavbar from "@/components/LandingNavbar";
import LandingHeroInteractive from "@/components/LandingHeroInteractive";
import LandingUnitExplorer, { SasUnitItem } from "@/components/LandingUnitExplorer";
import LandingSignatureShowcase from "@/components/LandingSignatureShowcase";
import LandingWorkflowRoadmap from "@/components/LandingWorkflowRoadmap";
import LandingBentoArchitecture from "@/components/LandingBentoArchitecture";
import LandingFaqAccordion from "@/components/LandingFaqAccordion";
import LandingCtaSection from "@/components/LandingCtaSection";
import LandingFooter from "@/components/LandingFooter";

export const dynamic = "force-dynamic";

const UNIT_METADATA_MAP: Record<
  string,
  {
    badge: string;
    color: string;
    category: "counseling" | "career" | "student_life" | "governance";
    sla: string;
    confidentiality: "Maximum" | "High" | "Standard";
    desc: string;
    sampleDocs: string[];
  }
> = {
  GCO: {
    badge: "Confidentiality High",
    color: "from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/30",
    category: "counseling",
    sla: "< 24h SLA",
    confidentiality: "Maximum",
    desc: "Confidential student intake profiles, psychological evaluations, graduation clearances, and counselor endorsement slips.",
    sampleDocs: ["Student Psychological Intake", "Counselor Case Notes", "Graduation Guidance Clearance", "Crisis Intervention Referral"],
  },
  GUIDANCE: {
    badge: "Counseling & Psych",
    color: "from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/30",
    category: "counseling",
    sla: "< 24h SLA",
    confidentiality: "Maximum",
    desc: "Counseling documentation, intake assessments, peer facilitator programs, and psycho-educational modules.",
    sampleDocs: ["Intake Assessment", "Peer Facilitator Program", "Counselor Endorsement", "Student Psychological Profile"],
  },
  AAPO: {
    badge: "Partnership MOAs",
    color: "from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/30",
    category: "career",
    sla: "< 48h SLA",
    confidentiality: "High",
    desc: "Industry MOA agreements, alumni tracer reports, graduate networking clearances, and institutional partnership charters.",
    sampleDocs: ["Corporate MOA Partnership", "Alumni Tracer Verification", "Graduate Placement Release", "Homecoming Charter"],
  },
  ALUMNI: {
    badge: "Alumni Relations",
    color: "from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/30",
    category: "career",
    sla: "< 48h SLA",
    confidentiality: "High",
    desc: "Alumni registry, homecoming event documentation, alumni tracer studies, and chapter engagements.",
    sampleDocs: ["Alumni Chapter Charter", "Tracer Study Verification", "Homecoming Sponsorship Agreement", "Graduate Database Release"],
  },
  SOA: {
    badge: "Event Permits",
    color: "from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/30",
    category: "student_life",
    sla: "< 24h SLA",
    confidentiality: "Standard",
    desc: "Accreditation charters, campus activity proposals, off-campus event permits, and student council budget requisitions.",
    sampleDocs: ["Student Org Re-Accreditation", "Off-Campus Event Permit", "Council Budget Liquidation", "Activity Safety Protocol"],
  },
  ACTIVITIES: {
    badge: "Student Org Charters",
    color: "from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/30",
    category: "student_life",
    sla: "< 24h SLA",
    confidentiality: "Standard",
    desc: "Accredited student organizations, event proposals, campus permits, and activity liquidations.",
    sampleDocs: ["Org Recognition Charter", "Campus Activity Permit", "Fundraiser Authorization", "Year-End Financial Audit"],
  },
  SFA: {
    badge: "Grants & Vouchers",
    color: "from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30",
    category: "student_life",
    sla: "< 24h SLA",
    confidentiality: "High",
    desc: "Academic grant applications, third-party sponsor MOAs, financial aid validation vouchers, and donor audit covenants.",
    sampleDocs: ["Institutional Grant Application", "Third-Party Sponsor MOU", "Tuition Discount Voucher", "Donor Billing Roster"],
  },
  SCHOLARSHIPS: {
    badge: "Scholarships & Aid",
    color: "from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30",
    category: "student_life",
    sla: "< 24h SLA",
    confidentiality: "High",
    desc: "Institutional grants, government assistance endorsements, donor memoranda, and billing rosters.",
    sampleDocs: ["Government Aid Endorsement", "Academic Scholarship Contract", "Grant Certification", "Tuition Voucher"],
  },
  DSW: {
    badge: "Compliance Logs",
    color: "from-rose-500/20 to-rose-600/5 text-rose-400 border-rose-500/30",
    category: "governance",
    sla: "< 12h SLA",
    confidentiality: "Maximum",
    desc: "Incident resolution logs, behavioral clearances, student handbook notices, and official inquiry proceedings.",
    sampleDocs: ["Behavioral Clearance Notice", "Incident Inquiry Minutes", "Student Handbook Violation Log", "Good Moral Endorsement"],
  },
  DISCIPLINE: {
    badge: "Student Discipline",
    color: "from-rose-500/20 to-rose-600/5 text-rose-400 border-rose-500/30",
    category: "governance",
    sla: "< 12h SLA",
    confidentiality: "Maximum",
    desc: "Student handbook enforcement, incident investigations, clearance clearances, and character formation.",
    sampleDocs: ["Disciplinary Inquiry Docket", "Parent Conference Notice", "Behavioral Rehabilitation Plan", "Clearance Certificate"],
  },
  CSIR: {
    badge: "OJT Agreements",
    color: "from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/30",
    category: "career",
    sla: "< 24h SLA",
    confidentiality: "High",
    desc: "On-the-Job Training (OJT) memorandums, employer internship endorsements, student placement releases, and company profiles.",
    sampleDocs: ["OJT Student-Company Agreement", "Host Training Establishment Endorsement", "Practicum Performance Certificate", "Employer Accreditation"],
  },
  CAREER: {
    badge: "Placement & OJT",
    color: "from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/30",
    category: "career",
    sla: "< 24h SLA",
    confidentiality: "High",
    desc: "Industry partnerships, internship agreements, on-campus recruitments, and graduate placement.",
    sampleDocs: ["Industry Partnership Agreement", "Internship Endorsement", "Placement Clearance", "Campus Recruitment Charter"],
  },
  CEE: {
    badge: "Outreach Charters",
    color: "from-teal-500/20 to-teal-600/5 text-teal-400 border-teal-500/30",
    category: "governance",
    sla: "< 48h SLA",
    confidentiality: "Standard",
    desc: "Community outreach agreements, barangay LGU permits, volunteer service records, and social responsibility accreditations.",
    sampleDocs: ["Barangay LGU Community MOU", "Institutional Outreach Proposal", "Faculty/Student Volunteer Service Log", "Impact Assessment Report"],
  },
  EXTENSION: {
    badge: "Community Extension",
    color: "from-teal-500/20 to-teal-600/5 text-teal-400 border-teal-500/30",
    category: "governance",
    sla: "< 48h SLA",
    confidentiality: "Standard",
    desc: "Institutional outreach programs, community MOUs, volunteer logs, and project impact assessments.",
    sampleDocs: ["Community Partner Agreement", "Service Learning Project Proposal", "Barangay Clearance", "Outreach Impact Report"],
  },
};

export default async function HomePage() {
  let sasUnits: SasUnitItem[] = [];
  let liveStats = {
    totalDocuments: 0,
    totalVersions: 0,
    totalApproved: 0,
  };

  if (isDatabaseConfigured) {
    try {
      const [dbUnits, totalDocs, totalVersions, approvedDocs] = await Promise.all([
        prisma.unit.findMany({
          where: { isActive: true },
          orderBy: { name: "asc" },
        }),
        prisma.document.count(),
        prisma.documentVersion.count(),
        prisma.document.count({ where: { status: "APPROVED" } }),
      ]);

      liveStats = {
        totalDocuments: totalDocs,
        totalVersions: totalVersions,
        totalApproved: approvedDocs,
      };

      if (dbUnits && dbUnits.length > 0) {
        sasUnits = dbUnits.map((u) => {
          const upperCode = u.code.toUpperCase();
          const meta = UNIT_METADATA_MAP[upperCode];

          return {
            code: u.code,
            name: u.name,
            desc:
              u.description ||
              meta?.desc ||
              "Specialized departmental role permissions, compliance protocols, and document approval workflows.",
            badge: meta?.badge || "Active Unit",
            color: meta?.color || "from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/30",
            category: meta?.category || "student_life",
            sla: meta?.sla || "< 24h SLA",
            confidentiality: meta?.confidentiality || "High",
            sampleDocs: meta?.sampleDocs || ["General Department Proposal", "Unit Endorsement Memo", "Activity Report"],
          };
        });
      }
    } catch (err) {
      console.error("Failed to fetch units for landing page:", err);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-amber-400 selection:text-slate-950 relative overflow-x-hidden">
      {/* 1. Floating Frosted Glass Navbar */}
      <LandingNavbar unitCount={sasUnits.length} />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 2. Main Hero with Interactive Live Workflow Simulator */}
        <LandingHeroInteractive unitCount={sasUnits.length} liveStats={liveStats} />

        {/* 3. Filterable SAS Department Units Matrix */}
        <LandingUnitExplorer units={sasUnits} />

        {/* 5. Smart Anchor Vector E-Signature Showcase & Comparison */}
        <LandingSignatureShowcase />

        {/* 6. Sequential Turn-Based Life Cycle & 2-Rejection Escalation Engine */}
        <LandingWorkflowRoadmap />

        {/* 7. Enterprise Rigor Bento Architecture Grid */}
        <LandingBentoArchitecture />

        {/* 8. Categorized Interactive FAQs Accordion */}
        <LandingFaqAccordion />

        {/* 9. Institutional Conversion Call to Action */}
        <LandingCtaSection />
      </main>

      {/* 10. Comprehensive Institutional Telemetry Footer */}
      <LandingFooter unitCount={sasUnits.length} documentCount={liveStats.totalDocuments} />
    </div>
  );
}
