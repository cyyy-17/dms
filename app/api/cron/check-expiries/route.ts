import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queueNotification } from "@/lib/notifications";
import { logAuditEvent } from "@/lib/audit";
import { DocumentStatus } from "@prisma/client";
import { addDays, subDays } from "date-fns";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron execution." }, { status: 401 });
  }

  const today = new Date();
  const warningThreshold = addDays(today, 30); // Alert 30 days ahead

  // Find active documents expiring within the next 30 days that haven't been alerted in the last 7 days
  const expiringDocs = await prisma.document.findMany({
    where: {
      status: DocumentStatus.APPROVED,
      expiryDate: {
        gte: today,
        lte: warningThreshold,
      },
      OR: [
        { lastExpiryAlertSentAt: null },
        { lastExpiryAlertSentAt: { lte: subDays(today, 7) } },
      ],
    },
    include: {
      uploader: true,
      unit: {
        include: {
          users: {
            where: { role: "COORDINATOR", status: "ACTIVE" },
          },
        },
      },
    },
  });

  let alertsSent = 0;

  for (const doc of expiringDocs) {
    const daysLeft = Math.ceil(
      (new Date(doc.expiryDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Alert Uploader
    await queueNotification({
      recipientId: doc.uploaderId,
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

    // Alert Coordinators of the unit
    for (const coord of doc.unit.users) {
      await queueNotification({
        recipientId: coord.id,
        recipientEmail: coord.email,
        type: "DOCUMENT_EXPIRY_WARNING",
        subject: `SASDMS Unit Alert: Document Expiry in ${daysLeft} Days (${doc.trackingNumber})`,
        templateName: "document-expiry-alert",
        payload: {
          documentId: doc.id,
          trackingNumber: doc.trackingNumber,
          title: doc.title,
          expiryDate: doc.expiryDate,
          daysRemaining: daysLeft,
        },
      });
    }

    // Update lastExpiryAlertSentAt
    await prisma.document.update({
      where: { id: doc.id },
      data: { lastExpiryAlertSentAt: new Date() },
    });

    await logAuditEvent({
      unitId: doc.unitId,
      action: "DOCUMENT_EXPIRY_ALERT",
      targetType: "DOCUMENT",
      targetId: doc.id,
      documentId: doc.id,
      details: { daysRemaining: daysLeft, expiryDate: doc.expiryDate },
    });

    alertsSent++;
  }

  // Check Delegations Expiring within 72h
  const threshold72h = addDays(today, 3);
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

  let delegationAlertsSent = 0;
  for (const delegation of expiringDelegations) {
    const hoursRemaining = Math.max(
      1,
      Math.round((delegation.endDate.getTime() - today.getTime()) / (1000 * 60 * 60))
    );
    const daysRemaining = Math.ceil(hoursRemaining / 24);

    await queueNotification({
      recipientId: delegation.delegatorId,
      recipientEmail: delegation.delegator.email,
      type: "DOCUMENT_EXPIRY_WARNING",
      subject: `SASDMS Notice: Signatory Delegation Expiring in ${daysRemaining <= 1 ? `${hoursRemaining} Hours` : `${daysRemaining} Days`}`,
      templateName: "delegation-expiry-alert",
      payload: {
        delegationId: delegation.id,
        unitName: delegation.unit.name,
        delegateName: `${delegation.delegate.firstName} ${delegation.delegate.lastName}`,
        endDate: delegation.endDate,
        hoursRemaining,
      },
    });

    delegationAlertsSent++;
  }

  return NextResponse.json({
    success: true,
    expiringDocumentsCount: expiringDocs.length,
    documentAlertsDispatched: alertsSent,
    expiringDelegationsCount: expiringDelegations.length,
    delegationAlertsDispatched: delegationAlertsSent,
  });
}
