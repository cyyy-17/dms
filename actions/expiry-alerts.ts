"use server";

import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { queueNotification } from "@/lib/notifications";
import { DocumentStatus } from "@prisma/client";

export interface DocumentExpiryAlertResult {
  documentsChecked: number;
  alertsQueued: number;
  documentIds: string[];
}

/**
 * Checks for approved documents expiring in 30 days or less and queues alerts
 */
export async function checkExpiringDocumentsAction(): Promise<{
  success: boolean;
  result?: DocumentExpiryAlertResult;
  error?: string;
}> {
  if (!isDatabaseConfigured) {
    return {
      success: true,
      result: { documentsChecked: 0, alertsQueued: 0, documentIds: [] },
    };
  }

  try {
    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringDocs = await prisma.document.findMany({
      where: {
        status: DocumentStatus.APPROVED,
        isArchived: false,
        expiryDate: {
          gte: now,
          lte: thirtyDaysAhead,
        },
      },
      include: {
        uploader: { select: { id: true, email: true, firstName: true, lastName: true } },
        unit: { select: { name: true, code: true } },
      },
    });

    let alertsQueued = 0;
    const documentIds: string[] = [];

    for (const doc of expiringDocs) {
      documentIds.push(doc.id);
      const daysLeft = Math.ceil((new Date(doc.expiryDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // 1. Queue alert for document uploader
      await queueNotification({
        recipientId: doc.uploader.id,
        recipientEmail: doc.uploader.email,
        type: "DOCUMENT_EXPIRY_WARNING",
        subject: `SASDMS Reminder: Document Expiry in ${daysLeft} Days (${doc.trackingNumber})`,
        templateName: "document-expiry-alert",
        payload: {
          documentId: doc.id,
          trackingNumber: doc.trackingNumber,
          title: doc.title,
          expiryDate: doc.expiryDate,
          daysRemaining: daysLeft,
        },
      });

      alertsQueued++;
    }

    return {
      success: true,
      result: {
        documentsChecked: expiringDocs.length,
        alertsQueued,
        documentIds,
      },
    };
  } catch (error) {
    console.error("[EXPIRING_DOCS_ALERT_ERROR]", error);
    return { success: false, error: "Failed to process expiring document alerts." };
  }
}
