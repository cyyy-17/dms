// ============================================================================
// Student & Alumni Services DMS - System Constants & Business Rules
// ============================================================================

export const INSTITUTION_EMAIL_DOMAIN = "@firstasia.edu.ph";

/**
 * Standardized Student & Alumni Services Organizational Units
 * [Can be seeded into the database and adjusted by Admin]
 */
export const SEED_UNITS = [
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
] as const;

/**
 * Standardized Document Types and Approval Hierarchy
 */
export const SEED_DOCUMENT_TYPES = [
  {
    code: "MOU_MOA",
    name: "Memorandum of Agreement / Understanding",
    description: "Institutional partnerships, industry linkage, and external collaboration agreements.",
    defaultApprovalLevel: "DIRECTOR_REQUIRED",
    requiresExpiryTracking: true,
    defaultRetentionDays: 3650, // 10 years for contracts
  },
  {
    code: "EVENT_PROPOSAL",
    name: "Student Event / Activity Proposal",
    description: "Formal proposals for co-curricular and extra-curricular campus events.",
    defaultApprovalLevel: "COORDINATOR_ONLY",
    requiresExpiryTracking: false,
    defaultRetentionDays: 1825, // 5 years
  },
  {
    code: "CAMPUS_PERMIT",
    name: "Off-Campus / Campus Facility Permit",
    description: "Permit applications for off-campus excursions, facility use, and risk assessments.",
    defaultApprovalLevel: "DIRECTOR_REQUIRED",
    requiresExpiryTracking: false,
    defaultRetentionDays: 1825,
  },
  {
    code: "INCIDENT_REPORT",
    name: "Student Incident & Discipline Report",
    description: "Confidential behavioral incident documentations, hearing notes, and resolution actions.",
    defaultApprovalLevel: "DIRECTOR_REQUIRED",
    requiresExpiryTracking: false,
    defaultRetentionDays: 1825,
  },
  {
    code: "SCHOLARSHIP_ROSTER",
    name: "Scholarship & Grant Endorsement Roster",
    description: "Semester master lists of qualified institutional and external scholars.",
    defaultApprovalLevel: "DIRECTOR_REQUIRED",
    requiresExpiryTracking: true,
    defaultRetentionDays: 1825,
  },
  {
    code: "ACTIVITY_LIQUIDATION",
    name: "Activity Fund Liquidation Report",
    description: "Post-event financial statements, receipts, and disbursement liquidations.",
    defaultApprovalLevel: "COORDINATOR_ONLY",
    requiresExpiryTracking: false,
    defaultRetentionDays: 1825,
  },
  {
    code: "ALUMNI_REPORT",
    name: "Alumni Tracer & Employment Report",
    description: "Graduate tracer studies, employability statistical summaries, and survey analysis.",
    defaultApprovalLevel: "COORDINATOR_ONLY",
    requiresExpiryTracking: false,
    defaultRetentionDays: 1825,
  },
  {
    code: "GENERAL_ADMIN",
    name: "General Administrative Document",
    description: "Internal memoranda, unit communications, and operational reports.",
    defaultApprovalLevel: "COORDINATOR_ONLY",
    requiresExpiryTracking: false,
    defaultRetentionDays: 1825,
  },
] as const;

/**
 * Generate standardized human-readable tracking number
 * Format: SAS-YYYY-UNIT-XXXXX (e.g. SAS-2026-ALM-00042)
 */
export function generateTrackingNumber(unitCode: string, sequenceNumber: number): string {
  const year = new Date().getFullYear();
  const unitPrefix = unitCode.substring(0, 3).toUpperCase();
  const paddedSeq = sequenceNumber.toString().padStart(5, "0");
  return `SAS-${year}-${unitPrefix}-${paddedSeq}`;
}

/**
 * Rejection Auto-Escalation Threshold
 */
export const AUTO_ESCALATION_REJECTION_THRESHOLD = 2;

/**
 * Storage Bucket Names
 */
export const STORAGE_BUCKETS = {
  DOCUMENTS: "documents-private",
  SIGNATURES: "signatures-private",
} as const;
