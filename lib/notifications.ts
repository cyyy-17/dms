import { prisma } from "./prisma";
import { NotificationType } from "@prisma/client";

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
 * Resend API is NEVER called directly here — Vercel Cron worker reads this table.
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
        status: "PENDING",
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
