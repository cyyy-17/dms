"use server";

import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";

export interface RetentionSimulationResult {
  retentionYears: number;
  cutoffDate: string;
  eligibleCount: number;
  totalSizeBytes: number;
  unitDistribution: Record<string, number>;
  previewDocuments: Array<{
    id: string;
    trackingNumber: string;
    title: string;
    createdAt: string;
    unitCode: string;
    fileSize: number;
  }>;
}

export async function simulateRetentionDisposalAction(retentionYears: number = 5): Promise<{
  success: boolean;
  result?: RetentionSimulationResult;
  error?: string;
}> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { success: false, error: "Unauthorized. Admin role required." };
  }

  const cutoffMs = Date.now() - retentionYears * 365.25 * 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(cutoffMs);

  if (!isDatabaseConfigured) {
    return {
      success: true,
      result: {
        retentionYears,
        cutoffDate: cutoffDate.toISOString(),
        eligibleCount: 0,
        totalSizeBytes: 0,
        unitDistribution: {},
        previewDocuments: [],
      },
    };
  }

  try {
    const eligibleDocs = await prisma.document.findMany({
      where: {
        createdAt: { lte: cutoffDate },
        isArchived: false,
      },
      include: {
        unit: { select: { code: true } },
        currentVersion: { select: { fileSize: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    const totalEligibleCount = await prisma.document.count({
      where: {
        createdAt: { lte: cutoffDate },
        isArchived: false,
      },
    });

    let totalSizeBytes = 0;
    const unitDistribution: Record<string, number> = {};

    eligibleDocs.forEach((doc) => {
      const size = doc.currentVersion?.fileSize || 0;
      totalSizeBytes += size;
      const code = doc.unit?.code || "UNASSIGNED";
      unitDistribution[code] = (unitDistribution[code] || 0) + 1;
    });

    return {
      success: true,
      result: {
        retentionYears,
        cutoffDate: cutoffDate.toISOString(),
        eligibleCount: totalEligibleCount,
        totalSizeBytes,
        unitDistribution,
        previewDocuments: eligibleDocs.map((doc) => ({
          id: doc.id,
          trackingNumber: doc.trackingNumber,
          title: doc.title,
          createdAt: doc.createdAt.toISOString(),
          unitCode: doc.unit?.code || "GEN",
          fileSize: doc.currentVersion?.fileSize || 0,
        })),
      },
    };
  } catch (error) {
    console.error("[RETENTION_SIM_ERROR]", error);
    return { success: false, error: "Failed to simulate retention disposal." };
  }
}
