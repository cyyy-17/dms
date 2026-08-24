// ============================================================================
// Centralized Humanization & Label Formatters Map
// Single source of truth for converting raw system enums, bytes, and dates
// into polished, human-friendly presentation text across the entire UI.
// ============================================================================

import { DocumentStatus } from "@prisma/client";

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  [DocumentStatus.DRAFT]: "Draft (In Preparation)",
  [DocumentStatus.PENDING_COORDINATOR]: "Pending Coordinator Review",
  [DocumentStatus.PENDING_DIRECTOR]: "Pending Director Sign-off",
  [DocumentStatus.APPROVED]: "Fully Approved & Sealed",
  [DocumentStatus.REJECTED_RETURNED]: "Returned for Revision",
  [DocumentStatus.REJECTED_CLOSED]: "Closed & Rejected",
  [DocumentStatus.ARCHIVED]: "Archived (Preserved)",
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

export function getStatusLabel(status: DocumentStatus | string | null | undefined): string {
  if (!status) return "Unknown Status";
  return STATUS_LABELS[status as DocumentStatus] ?? status.replace(/_/g, " ");
}

export function getStatusBadgeClass(status: DocumentStatus | string | null | undefined): string {
  if (!status) return "badge-draft";
  return STATUS_BADGE_CLASSES[status as DocumentStatus] ?? "badge-draft";
}

// Role Formatters
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "System Administrator",
  DIRECTOR: "Executive Director",
  COORDINATOR: "Unit Coordinator",
  STAFF: "Department Staff",
};

export function getRoleLabel(role: string | null | undefined): string {
  if (!role) return "Staff Member";
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ");
}

// Action Formatters
export const ACTION_LABELS: Record<string, string> = {
  SUBMIT: "Submitted for Sequential Review",
  COORDINATOR_APPROVE: "Approved by Unit Coordinator",
  DIRECTOR_APPROVE: "Final Executive Approval by Director",
  REJECT_RETURN: "Returned for Author Revision",
  REJECT_CLOSE: "Formally Closed / Rejected",
  ESCALATE: "Auto-Escalated to Executive Director",
  DOCUMENT_OVERRIDE: "Administrative Governance Override",
  SIGNATURE_REGISTERED: "Electronic Signature Registered",
  USER_STATUS_CHANGE: "User Verification Status Updated",
  DELEGATION_CREATED: "Review Authority Delegated",
  RETENTION_PURGE: "Automated Lifecycle Retention Purge",
};

export function getActionLabel(action: string | null | undefined): string {
  if (!action) return "System Activity";
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}

// Target Type Formatters
export const TARGET_TYPE_LABELS: Record<string, string> = {
  DOCUMENT: "Document Package",
  USER: "User Account",
  UNIT: "Department Unit",
  DOCTYPE: "Document Classification",
  DELEGATION: "Signatory Authority",
  SYSTEM: "Institutional Governance Engine",
};

export function getTargetTypeLabel(targetType: string | null | undefined): string {
  if (!targetType) return "System Object";
  return TARGET_TYPE_LABELS[targetType] ?? targetType.replace(/_/g, " ");
}

// File Size Formatter
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// Date Formatter
export function formatHumanDate(date: Date | string | null | undefined): string {
  if (!date) return "Not specified";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Invalid Date";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatHumanDateTime(date: Date | string | null | undefined): string {
  if (!date) return "Not specified";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Invalid Date";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format raw JSON details into humanized key-value list
export function formatAuditDetailsSummary(details: unknown): string {
  if (!details) return "No extra metadata recorded.";
  if (typeof details === "string") {
    try {
      const parsed = JSON.parse(details);
      return formatAuditDetailsSummary(parsed);
    } catch {
      return details;
    }
  }
  if (typeof details === "object" && details !== null) {
    const entries = Object.entries(details as Record<string, unknown>);
    if (entries.length === 0) return "Standard audit stamp";
    return entries
      .map(([k, v]) => {
        const formattedKey = k.replace(/([A-Z])/g, " $1").replace(/_/g, " ");
        const formattedVal =
          typeof v === "object" ? JSON.stringify(v) : String(v);
        return `${formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1)}: ${formattedVal}`;
      })
      .join(" • ");
  }
  return String(details);
}
