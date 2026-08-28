"use server";

import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { NotificationStatus } from "@prisma/client";

export interface SystemDiagnostics {
  dbStatus: "HEALTHY" | "DEGRADED" | "OFFLINE";
  dbLatencyMs: number;
  storageStatus: "ONLINE" | "DEGRADED";
  pendingNotifications: number;
  failedNotifications: number;
  totalUsers: number;
  totalDocuments: number;
  totalVersions: number;
  totalSignatures: number;
  totalAuditEvents: number;
  memoryUsageMb: number;
  timestamp: string;
}

export async function getSystemDiagnosticsAction(): Promise<{
  success: boolean;
  diagnostics?: SystemDiagnostics;
  error?: string;
}> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { success: false, error: "Unauthorized. Admin role required." };
  }

  if (!isDatabaseConfigured) {
    return {
      success: true,
      diagnostics: {
        dbStatus: "DEGRADED",
        dbLatencyMs: 0,
        storageStatus: "ONLINE",
        pendingNotifications: 0,
        failedNotifications: 0,
        totalUsers: 1,
        totalDocuments: 0,
        totalVersions: 0,
        totalSignatures: 0,
        totalAuditEvents: 0,
        memoryUsageMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        timestamp: new Date().toISOString(),
      },
    };
  }

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - start;

    const [pendingNotifs, failedNotifs, totalUsers, totalDocs, totalVers, totalSigs, totalAudits] =
      await Promise.all([
        prisma.notificationQueue.count({ where: { status: NotificationStatus.PENDING } }),
        prisma.notificationQueue.count({ where: { status: NotificationStatus.FAILED } }),
        prisma.user.count(),
        prisma.document.count(),
        prisma.documentVersion.count(),
        prisma.approvalAction.count({ where: { signatureApplied: true } }),
        prisma.auditLog.count(),
      ]);

    const mem = process.memoryUsage();
    const memoryUsageMb = Math.round(mem.rss / (1024 * 1024));

    return {
      success: true,
      diagnostics: {
        dbStatus: dbLatencyMs < 200 ? "HEALTHY" : "DEGRADED",
        dbLatencyMs,
        storageStatus: "ONLINE",
        pendingNotifications: pendingNotifs,
        failedNotifications: failedNotifs,
        totalUsers,
        totalDocuments: totalDocs,
        totalVersions: totalVers,
        totalSignatures: totalSigs,
        totalAuditEvents: totalAudits,
        memoryUsageMb,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("[DIAGNOSTICS_ERROR]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to query system diagnostics.",
    };
  }
}
