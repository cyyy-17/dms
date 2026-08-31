import { prisma } from "./prisma";
import { NotificationType, NotificationStatus } from "@prisma/client";
import { Resend } from "resend";
import { renderNotificationEmail } from "./email-templates";

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
 * Dispatch notification email immediately via Resend API and persist status to NotificationQueue.
 * Used for critical time-sensitive flows like Password Reset.
 */
export async function dispatchImmediateNotification(params: QueueNotificationParams): Promise<{
  success: boolean;
  resendId?: string;
  error?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.SYSTEM_SENDER_EMAIL || "SAS Document System <onboarding@resend.dev>";

  const rendered = renderNotificationEmail({
    type: params.type,
    templateName: params.templateName,
    subject: params.subject,
    payload: params.payload,
    recipientEmail: params.recipientEmail,
  });

  if (!apiKey || apiKey.startsWith("re_placeholder") || apiKey.includes("your_resend_api_key")) {
    console.error("[IMMEDIATE_NOTIFICATION_ERROR] RESEND_API_KEY is not configured on the server.");
    await queueNotification(params);
    return {
      success: false,
      error: "Email delivery service (RESEND_API_KEY) is not configured in your Vercel Project Settings.",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { data: resendData, error: sendError } = await resend.emails.send({
      from: sender,
      to: params.recipientEmail.trim().toLowerCase(),
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    if (sendError) {
      console.error("[RESEND_DIRECT_SEND_ERROR]", sendError);
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
            lastError: sendError.message,
            scheduledFor: new Date(Date.now() + 120000),
          },
        });
      } catch (dbErr) {
        console.error("[NOTIFICATION_DB_LOG_ERROR]", dbErr);
      }
      return { success: false, error: sendError.message };
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

    return { success: true, resendId: resendData?.id };
  } catch (err: unknown) {
    console.error("[IMMEDIATE_NOTIFICATION_EXCEPTION]", err);
    await queueNotification(params);
    const msg = err instanceof Error ? err.message : "Failed to dispatch email via Resend";
    return { success: false, error: msg };
  }
}
