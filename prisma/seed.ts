import "dotenv/config";
import { ApprovalLevel } from "@prisma/client";
import { prisma } from "../lib/prisma";

const SEED_UNITS = [
  {
    code: "CAREER",
    name: "Career Services & Placement",
    description: "Industry partnerships, internship agreements, on-campus recruitments, and graduate placement.",
  },
  {
    code: "ALUMNI",
    name: "Alumni Relations & Affairs",
    description: "Alumni registry, homecoming event documentation, alumni tracer studies, and chapter engagements.",
  },
  {
    code: "ACTIVITIES",
    name: "Student Organizations & Activities",
    description: "Accredited student organizations, event proposals, campus permits, and activity liquidations.",
  },
  {
    code: "DISCIPLINE",
    name: "Student Discipline & Formation",
    description: "Student handbook enforcement, incident investigations, clearance clearances, and character formation.",
  },
  {
    code: "GUIDANCE",
    name: "Guidance & Psychological Services",
    description: "Counseling documentation, intake assessments, peer facilitator programs, and psycho-educational modules.",
  },
  {
    code: "SCHOLARSHIPS",
    name: "Scholarships & Financial Assistance",
    description: "Institutional grants, government assistance endorsements, donor memoranda, and billing rosters.",
  },
  {
    code: "EXTENSION",
    name: "Community Extension & Engagement",
    description: "Institutional outreach programs, community MOUs, volunteer logs, and project impact assessments.",
  },
];

const SEED_DOCUMENT_TYPES = [
  {
    code: "MOU_MOA",
    name: "Memorandum of Agreement / Understanding",
    description: "Institutional partnerships, industry linkage, and external collaboration agreements.",
    defaultApprovalLevel: ApprovalLevel.DIRECTOR_REQUIRED,
    requiresExpiryTracking: true,
    defaultRetentionDays: 3650,
  },
  {
    code: "EVENT_PROPOSAL",
    name: "Student Event / Activity Proposal",
    description: "Formal proposals for co-curricular and extra-curricular campus events.",
    defaultApprovalLevel: ApprovalLevel.COORDINATOR_ONLY,
    requiresExpiryTracking: false,
    defaultRetentionDays: 1825,
  },
  {
    code: "CAMPUS_PERMIT",
    name: "Off-Campus / Campus Facility Permit",
    description: "Permit applications for off-campus excursions, facility use, and risk assessments.",
    defaultApprovalLevel: ApprovalLevel.DIRECTOR_REQUIRED,
    requiresExpiryTracking: false,
    defaultRetentionDays: 1825,
  },
  {
    code: "INCIDENT_REPORT",
    name: "Student Incident & Discipline Report",
    description: "Confidential behavioral incident documentations, hearing notes, and resolution actions.",
    defaultApprovalLevel: ApprovalLevel.DIRECTOR_REQUIRED,
    requiresExpiryTracking: false,
    defaultRetentionDays: 1825,
  },
  {
    code: "SCHOLARSHIP_ROSTER",
    name: "Scholarship & Grant Endorsement Roster",
    description: "Semester master lists of qualified institutional and external scholars.",
    defaultApprovalLevel: ApprovalLevel.DIRECTOR_REQUIRED,
    requiresExpiryTracking: true,
    defaultRetentionDays: 1825,
  },
  {
    code: "ACTIVITY_LIQUIDATION",
    name: "Activity Fund Liquidation Report",
    description: "Post-event financial statements, receipts, and disbursement liquidations.",
    defaultApprovalLevel: ApprovalLevel.COORDINATOR_ONLY,
    requiresExpiryTracking: false,
    defaultRetentionDays: 1825,
  },
  {
    code: "ALUMNI_REPORT",
    name: "Alumni Tracer & Employment Report",
    description: "Graduate tracer studies, employability statistical summaries, and survey analysis.",
    defaultApprovalLevel: ApprovalLevel.COORDINATOR_ONLY,
    requiresExpiryTracking: false,
    defaultRetentionDays: 1825,
  },
  {
    code: "GENERAL_ADMIN",
    name: "General Administrative Document",
    description: "Internal memoranda, unit communications, and operational reports.",
    defaultApprovalLevel: ApprovalLevel.COORDINATOR_ONLY,
    requiresExpiryTracking: false,
    defaultRetentionDays: 1825,
  },
];

async function main() {
  console.log("Seeding SASDMS Units...");
  for (const unit of SEED_UNITS) {
    await prisma.unit.upsert({
      where: { code: unit.code },
      update: { name: unit.name, description: unit.description },
      create: {
        code: unit.code,
        name: unit.name,
        description: unit.description,
        isActive: true,
      },
    });
  }

  console.log("Seeding SASDMS Document Types...");
  for (const docType of SEED_DOCUMENT_TYPES) {
    await prisma.documentType.upsert({
      where: { code: docType.code },
      update: {
        name: docType.name,
        description: docType.description,
        defaultApprovalLevel: docType.defaultApprovalLevel,
        requiresExpiryTracking: docType.requiresExpiryTracking,
        defaultRetentionDays: docType.defaultRetentionDays,
      },
      create: {
        code: docType.code,
        name: docType.name,
        description: docType.description,
        defaultApprovalLevel: docType.defaultApprovalLevel,
        requiresExpiryTracking: docType.requiresExpiryTracking,
        defaultRetentionDays: docType.defaultRetentionDays,
        isActive: true,
      },
    });
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
