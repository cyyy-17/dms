"use server";

import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { DocumentStatus } from "@prisma/client";

export interface UnitVelocityMetric {
  unitCode: string;
  unitName: string;
  approvedCount: number;
  avgTurnaroundHours: number;
  rating: "FAST" | "MODERATE" | "ATTENTION";
}

export interface ApprovalVelocityReport {
  overallAvgHours: number;
  totalApprovedDocs: number;
  fastestUnit: string;
  slowestUnit: string;
  unitMetrics: UnitVelocityMetric[];
}

export async function getApprovalVelocityAction(): Promise<{
  success: boolean;
  report?: ApprovalVelocityReport;
  error?: string;
}> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized." };
  }

  if (!isDatabaseConfigured) {
    const mockMetrics: UnitVelocityMetric[] = [
      { unitCode: "CAREER", unitName: "Career Services & Placement", approvedCount: 14, avgTurnaroundHours: 18.5, rating: "FAST" },
      { unitCode: "GUIDANCE", unitName: "Guidance & Counseling", approvedCount: 22, avgTurnaroundHours: 14.2, rating: "FAST" },
      { unitCode: "ACTIVITIES", unitName: "Student Activities", approvedCount: 31, avgTurnaroundHours: 36.0, rating: "MODERATE" },
      { unitCode: "SCHOLARSHIPS", unitName: "Scholarships & Financial Assistance", approvedCount: 19, avgTurnaroundHours: 28.4, rating: "MODERATE" },
      { unitCode: "DISCIPLINE", unitName: "Student Discipline", approvedCount: 8, avgTurnaroundHours: 42.1, rating: "MODERATE" },
      { unitCode: "ALUMNI", unitName: "Alumni Affairs & Placement", approvedCount: 12, avgTurnaroundHours: 21.0, rating: "FAST" },
      { unitCode: "EXTENSION", unitName: "Community Extension", approvedCount: 6, avgTurnaroundHours: 78.5, rating: "ATTENTION" },
    ];

    return {
      success: true,
      report: {
        overallAvgHours: 28.5,
        totalApprovedDocs: 112,
        fastestUnit: "GUIDANCE (14.2h)",
        slowestUnit: "EXTENSION (78.5h)",
        unitMetrics: mockMetrics,
      },
    };
  }

  try {
    const units = await prisma.unit.findMany({
      include: {
        documents: {
          where: { status: DocumentStatus.APPROVED },
          select: { createdAt: true, updatedAt: true },
        },
      },
    });

    let totalApproved = 0;
    let totalHoursSum = 0;
    const unitMetrics: UnitVelocityMetric[] = [];

    units.forEach((unit) => {
      const docCount = unit.documents.length;
      totalApproved += docCount;

      let unitHoursSum = 0;
      unit.documents.forEach((d) => {
        const diffMs = new Date(d.updatedAt).getTime() - new Date(d.createdAt).getTime();
        unitHoursSum += diffMs / (1000 * 60 * 60);
      });

      const avgHours = docCount > 0 ? Math.round((unitHoursSum / docCount) * 10) / 10 : 0;
      totalHoursSum += unitHoursSum;

      let rating: "FAST" | "MODERATE" | "ATTENTION" = "FAST";
      if (avgHours > 72) rating = "ATTENTION";
      else if (avgHours > 24) rating = "MODERATE";

      unitMetrics.push({
        unitCode: unit.code,
        unitName: unit.name,
        approvedCount: docCount,
        avgTurnaroundHours: avgHours,
        rating,
      });
    });

    unitMetrics.sort((a, b) => (a.avgTurnaroundHours || 999) - (b.avgTurnaroundHours || 999));

    const overallAvg = totalApproved > 0 ? Math.round((totalHoursSum / totalApproved) * 10) / 10 : 0;
    const fastest = unitMetrics.find((u) => u.approvedCount > 0);
    const slowest = [...unitMetrics].reverse().find((u) => u.approvedCount > 0);

    return {
      success: true,
      report: {
        overallAvgHours: overallAvg,
        totalApprovedDocs: totalApproved,
        fastestUnit: fastest ? `${fastest.unitCode} (${fastest.avgTurnaroundHours}h)` : "N/A",
        slowestUnit: slowest ? `${slowest.unitCode} (${slowest.avgTurnaroundHours}h)` : "N/A",
        unitMetrics,
      },
    };
  } catch (error) {
    console.error("[APPROVAL_VELOCITY_ERROR]", error);
    return { success: false, error: "Failed to compute approval velocity metrics." };
  }
}
