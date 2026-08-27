// ============================================================================
// Student & Alumni Services DMS - System Constants & Business Rules
// ============================================================================

export const INSTITUTION_EMAIL_DOMAIN = "@firstasia.edu.ph";



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
