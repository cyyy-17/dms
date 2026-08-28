/**
 * SLA Turnaround Deadline Calculation Utility
 * Compliant with institutional review turnaround targets for Unit Coordinators and Directors.
 */

export interface SlaEvaluation {
  status: "ON_TRACK" | "APPROACHING" | "OVERDUE";
  hoursRemaining: number;
  label: string;
  badgeClass: string;
  isOverdue: boolean;
}

/**
 * Calculates remaining SLA review duration from ingestion/submission timestamp.
 * Default SLA: 48 hours for coordinator review, 72 hours for director review.
 */
export function calculateSlaStatus(
  submittedAt: Date | string,
  slaHours: number = 48,
  referenceDate: Date = new Date()
): SlaEvaluation {
  const subDate = new Date(submittedAt);
  const deadlineMs = subDate.getTime() + slaHours * 60 * 60 * 1000;
  const nowMs = referenceDate.getTime();
  const diffMs = deadlineMs - nowMs;
  const hoursRemaining = Math.round(diffMs / (1000 * 60 * 60));

  if (hoursRemaining < 0) {
    const overdueHours = Math.abs(hoursRemaining);
    const overdueDays = Math.floor(overdueHours / 24);
    const overdueLabel = overdueDays > 0 ? `Overdue by ${overdueDays}d` : `Overdue by ${overdueHours}h`;

    return {
      status: "OVERDUE",
      hoursRemaining,
      label: overdueLabel,
      badgeClass: "bg-red-500 text-white font-black animate-pulse shadow-xs",
      isOverdue: true,
    };
  }

  if (hoursRemaining <= 24) {
    return {
      status: "APPROACHING",
      hoursRemaining,
      label: `Due in ${hoursRemaining}h`,
      badgeClass: "bg-amber-100 text-amber-900 border border-amber-300 font-black",
      isOverdue: false,
    };
  }

  const daysRemaining = Math.ceil(hoursRemaining / 24);
  return {
    status: "ON_TRACK",
    hoursRemaining,
    label: `${daysRemaining}d SLA left`,
    badgeClass: "bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold",
    isOverdue: false,
  };
}
