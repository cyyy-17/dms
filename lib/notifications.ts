import { prisma } from "./prisma";
import { NotificationType, NotificationStatus } from "@prisma/client";
import { sendEmail } from "./email-service";

export interface QueueNotificationParams {
  recipientId: string;
  recipientEmail: string;
  type: NotificationType;
  subject: string;
  templateName: string;
  payload: Record<string, unknown>;
  scheduledFor?: Date;
}

/**
 * Enqueue notification into the background queue.
 */
export async function queueNotification(params: QueueNotificationParams) {
  try {
    return await prisma.notificationQueue.create({
      data: {
        recipientId: params.recipientId,
        recipientEmail: params.recipientEmail.toLowerCase().trim(),
        type: params.type,
        subject: params.subject,
        templateName: params.templateName,
        payload: params.payload as object,
        status: NotificationStatus.PENDING,
        attempts: 0,
        maxAttempts: 3,
        scheduledFor: params.scheduledFor || new Date(),
      },
    });
  } catch (error) {
    console.error("[NOTIFICATION_QUEUE_ERROR] Failed to queue notification:", error);
    return null;
  }
}

/**
 * Dispatch notification email immediately via SMTP / Resend and persist status to NotificationQueue.
 * Used for critical time-sensitive flows like Password Reset.
 */
export async function dispatchImmediateNotification(params: QueueNotificationParams): Promise<{
  success: boolean;
  messageId?: string;
  provider?: string;
  error?: string;
}> {
  const result = await sendEmail({
    recipientId: params.recipientId,
    recipientEmail: params.recipientEmail,
    type: params.type,
    subject: params.subject,
    templateName: params.templateName,
    payload: params.payload,
  });

  if (!result.success) {
    console.error("[IMMEDIATE_NOTIFICATION_ERROR]", result.error);
    try {
      await prisma.notificationQueue.create({
        data: {
          recipientId: params.recipientId,
          recipientEmail: params.recipientEmail.toLowerCase().trim(),
          type: params.type,
          subject: params.subject,
          templateName: params.templateName,
          payload: params.payload as object,
          status: NotificationStatus.FAILED,
          attempts: 1,
          maxAttempts: 3,
          lastError: result.error,
          scheduledFor: new Date(Date.now() + 120000),
        },
      });
    } catch (dbErr) {
      console.error("[NOTIFICATION_DB_LOG_ERROR]", dbErr);
    }
    return {
      success: false,
      error: result.error,
      provider: result.provider,
    };
  }

  try {
    await prisma.notificationQueue.create({
      data: {
        recipientId: params.recipientId,
        recipientEmail: params.recipientEmail.toLowerCase().trim(),
        type: params.type,
        subject: params.subject,
        templateName: params.templateName,
        payload: params.payload as object,
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        attempts: 1,
        maxAttempts: 3,
      },
    });
  } catch (dbErr) {
    console.error("[NOTIFICATION_DB_LOG_ERROR]", dbErr);
  }

  return {
    success: true,
    messageId: result.messageId,
    provider: result.provider,
  };
}
