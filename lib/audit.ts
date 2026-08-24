import { headers } from "next/headers";
import { prisma } from "./prisma";
import { AuditAction } from "@prisma/client";

export interface LogAuditParams {
  actorId?: string | null;
  unitId?: string | null;
  action: AuditAction;
  targetType: "DOCUMENT" | "USER" | "VERSION" | "AUTH" | "CONFIG" | "DELEGATION";
  targetId?: string | null;
  documentId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Immutable Audit Event Logger (Compliant with Data Privacy Act RA 10173)
 */
export async function logAuditEvent(params: LogAuditParams) {
  try {
    let resolvedIp = params.ipAddress;
    let resolvedUa = params.userAgent;

    if (!resolvedIp || !resolvedUa) {
      try {
        const headerList = await headers();
        resolvedIp =
          resolvedIp ||
          headerList.get("x-forwarded-for")?.split(",")[0].trim() ||
          headerList.get("x-real-ip") ||
          "127.0.0.1";
        resolvedUa = resolvedUa || headerList.get("user-agent") || "Internal System";
      } catch {
        resolvedIp = resolvedIp || "127.0.0.1";
        resolvedUa = resolvedUa || "Internal Background Task";
      }
    }

    return await prisma.auditLog.create({
      data: {
        actorId: params.actorId || null,
        unitId: params.unitId || null,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId || null,
        documentId: params.documentId || null,
        details: (params.details as object) || {},
        ipAddress: resolvedIp,
        userAgent: resolvedUa,
      },
    });
  } catch (error) {
    // Non-blocking catch to ensure core transactions don't fail, but log to stderr
    console.error("[AUDIT_LOG_ERROR] Failed to record immutable audit log:", error);
    return null;
  }
}
