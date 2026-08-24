// ============================================================================
// Centralized Document Status Label Map
// Single source of truth for human-readable status strings across the UI.
// ============================================================================

import { DocumentStatus } from "@prisma/client";

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  [DocumentStatus.DRAFT]: "Draft",
  [DocumentStatus.PENDING_COORDINATOR]: "Pending Coordinator",
  [DocumentStatus.PENDING_DIRECTOR]: "Pending Director",
  [DocumentStatus.APPROVED]: "Approved & Sealed",
  [DocumentStatus.REJECTED_RETURNED]: "Returned for Revision",
  [DocumentStatus.REJECTED_CLOSED]: "Closed / Rejected",
  [DocumentStatus.ARCHIVED]: "Archived",
};

export const STATUS_BADGE_CLASSES: Record<DocumentStatus, string> = {
  [DocumentStatus.DRAFT]: "badge-draft",
  [DocumentStatus.PENDING_COORDINATOR]: "badge-pending",
  [DocumentStatus.PENDING_DIRECTOR]: "badge-pending",
  [DocumentStatus.APPROVED]: "badge-approved",
  [DocumentStatus.REJECTED_RETURNED]: "badge-returned",
  [DocumentStatus.REJECTED_CLOSED]: "badge-closed",
  [DocumentStatus.ARCHIVED]: "badge-closed",
};

export function getStatusLabel(status: DocumentStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function getStatusBadgeClass(status: DocumentStatus): string {
  return STATUS_BADGE_CLASSES[status] ?? "badge-draft";
}
