import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { NotificationStatus } from "@prisma/client";

import { renderNotificationEmail } from "@/lib/email-templates";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

export async function GET(req: NextRequest) {
  // Verify Vercel Cron Authorization Header
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron execution." }, { status: 401 });
  }

  // Fetch pending notifications scheduled for now or earlier (Limit: 25 per run)
  const pendingJobs = await prisma.notificationQueue.findMany({
    where: {
      status: NotificationStatus.PENDING,
      scheduledFor: { lte: new Date() },
      attempts: { lt: 3 },
    },
    take: 25,
    orderBy: { scheduledFor: "asc" },
  });

  const results = {
    total: pendingJobs.length,
    dispatched: 0,
    failed: 0,
  };

  const sender = process.env.SYSTEM_SENDER_EMAIL || "SAS Document System <sasdms-notifications@firstasia.edu.ph>";

  for (const job of pendingJobs) {
    try {
      if (process.env.RESEND_API_KEY) {
        const payload = (typeof job.payload === "object" && job.payload !== null)
          ? (job.payload as Record<string, unknown>)
          : {};

        const rendered = renderNotificationEmail({
          type: job.type,
          templateName: job.templateName,
          subject: job.subject,
          payload,
          recipientEmail: job.recipientEmail,
        });

        await resend.emails.send({
          from: sender,
          to: job.recipientEmail,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
        });
      }

      await prisma.notificationQueue.update({
        where: { id: job.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
          attempts: job.attempts + 1,
        },
      });

      results.dispatched++;
    } catch (err: unknown) {
      const nextAttempt = job.attempts + 1;
      const isPermanentlyFailed = nextAttempt >= job.maxAttempts;
      const errorMessage = err instanceof Error ? err.message : "SMTP send failed";

      await prisma.notificationQueue.update({
        where: { id: job.id },
        data: {
          attempts: nextAttempt,
          status: isPermanentlyFailed ? NotificationStatus.FAILED : NotificationStatus.PENDING,
          lastError: errorMessage,
          // Exponential backoff: 2^attempts * 2 minutes
          scheduledFor: new Date(Date.now() + Math.pow(2, nextAttempt) * 120000),
        },
      });

      results.failed++;
    }
  }

  return NextResponse.json({ success: true, ...results });
}
