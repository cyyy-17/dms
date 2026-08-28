"use server";

import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { queueNotification } from "@/lib/notifications";
import { logAuditEvent } from "@/lib/audit";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { addDays } from "date-fns";
import { revalidatePath } from "next/cache";

/**
 * Checks for active delegations expiring within 72 hours (3 days)
 * and dispatches warning notifications to the delegator, delegate, and unit coordinators.
 */
export async function checkExpiringDelegationsAction(): Promise<{
  success: boolean;
  alertedCount: number;
  error?: string;
}> {
  const currentUser = await getAuthenticatedUser();
  if (currentUser && currentUser.role !== "ADMIN" && currentUser.role !== "DIRECTOR") {
    return { success: false, alertedCount: 0, error: "Unauthorized access." };
  }

  if (!isDatabaseConfigured) {
    return { success: true, alertedCount: 0 };
  }

  try {
    const today = new Date();
    const threshold72h = addDays(today, 3); // 3 days ahead

    // Find active delegations expiring within the next 3 days
    const expiringDelegations = await prisma.delegateSignatory.findMany({
      where: {
        isActive: true,
        endDate: {
          gte: today,
          lte: threshold72h,
        },
      },
      include: {
        delegator: true,
        delegate: true,
        unit: true,
      },
    });

    let alertedCount = 0;

    for (const delegation of expiringDelegations) {
      const hoursRemaining = Math.max(
        1,
        Math.round((delegation.endDate.getTime() - today.getTime()) / (1000 * 60 * 60))
      );
      const daysRemaining = Math.ceil(hoursRemaining / 24);

      const subject = `SASDMS Notice: Signatory Delegation Expiring in ${
        daysRemaining <= 1 ? `${hoursRemaining} Hours` : `${daysRemaining} Days`
      }`;

      // 1. Notify Delegator
      await queueNotification({
        recipientId: delegation.delegatorId,
        recipientEmail: delegation.delegator.email,
        type: "DOCUMENT_EXPIRY_WARNING",
        subject,
        templateName: "delegation-expiry-alert",
        payload: {
          delegationId: delegation.id,
          unitName: delegation.unit.name,
          delegateName: `${delegation.delegate.firstName} ${delegation.delegate.lastName}`,
          endDate: delegation.endDate,
          hoursRemaining,
        },
      });

      // 2. Notify Delegate
      await queueNotification({
        recipientId: delegation.delegateId,
        recipientEmail: delegation.delegate.email,
        type: "DOCUMENT_EXPIRY_WARNING",
        subject: `SASDMS Notice: Acting Signatory Delegation Ending Soon (${delegation.unit.code})`,
        templateName: "delegation-expiry-alert",
        payload: {
          delegationId: delegation.id,
          unitName: delegation.unit.name,
          delegatorName: `${delegation.delegator.firstName} ${delegation.delegator.lastName}`,
          endDate: delegation.endDate,
          hoursRemaining,
        },
      });

      // 3. Log Audit Event
      await logAuditEvent({
        actorId: currentUser?.id || null,
        unitId: delegation.unitId,
        action: "DELEGATION_ASSIGNED",
        targetType: "DELEGATION",
        targetId: delegation.id,
        details: {
          actionType: "DELEGATION_EXPIRY_ALERT",
          delegatorId: delegation.delegatorId,
          delegateId: delegation.delegateId,
          endDate: delegation.endDate,
          hoursRemaining,
        },
      });

      alertedCount++;
    }

    revalidatePath("/dashboard/admin/delegations");
    return { success: true, alertedCount };
  } catch (error) {
    console.error("[DELEGATION_EXPIRY_CHECK_ERROR]", error);
    return { success: false, alertedCount: 0, error: "Failed to process delegation expiry alerts." };
  }
}

/**
 * Deactivates all expired delegations whose endDate is past now and isActive is true
 */
export async function batchRevokeExpiredDelegationsAction(): Promise<{
  success: boolean;
  revokedCount: number;
  error?: string;
}> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "DIRECTOR")) {
    return { success: false, revokedCount: 0, error: "Unauthorized. Admin privileges required." };
  }

  if (!isDatabaseConfigured) {
    return { success: true, revokedCount: 0 };
  }

  try {
    const now = new Date();
    const result = await prisma.delegateSignatory.updateMany({
      where: {
        isActive: true,
        endDate: { lt: now },
      },
      data: {
        isActive: false,
      },
    });

    if (result.count > 0) {
      await logAuditEvent({
        actorId: currentUser.id,
        unitId: currentUser.unitId,
        action: "DELEGATION_REVOKED",
        targetType: "DELEGATION",
        targetId: `${result.count}_DELEGATIONS`,
        details: {
          actionType: "BATCH_EXPIRED_CLEANUP",
          revokedCount: result.count,
        },
      });
    }

    revalidatePath("/dashboard/admin/delegations");
    return { success: true, revokedCount: result.count };
  } catch (error) {
    console.error("[BATCH_REVOKE_DELEGATIONS_ERROR]", error);
    return { success: false, revokedCount: 0, error: "Failed to batch revoke expired delegations." };
  }
}
