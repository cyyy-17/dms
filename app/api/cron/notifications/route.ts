import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NotificationStatus } from "@prisma/client";
import { sendEmail } from "@/lib/email-service";

export async function GET(req: NextRequest) {
  // Verify Vercel Cron Authorization Header
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
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

  for (const job of pendingJobs) {
    try {
      const payload =
        typeof job.payload === "object" && job.payload !== null
          ? (job.payload as Record<string, unknown>)
          : {};

      const result = await sendEmail({
        recipientId: job.recipientId,
        recipientEmail: job.recipientEmail,
        type: job.type,
        subject: job.subject,
        templateName: job.templateName,
        payload,
      });

      if (!result.success) {
        throw new Error(result.error || "Email delivery failed");
      }

      await prisma.notificationQueue.update({
        where: { id: job.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
          attempts: job.attempts + 1,
          lastError: null,
        },
      });

      results.dispatched++;
    } catch (err: unknown) {
      results.failed++;
      const errorMessage = err instanceof Error ? err.message : String(err);
      const isMaxAttempts = job.attempts + 1 >= job.maxAttempts;

      await prisma.notificationQueue.update({
        where: { id: job.id },
        data: {
          status: isMaxAttempts ? NotificationStatus.FAILED : NotificationStatus.PENDING,
          attempts: job.attempts + 1,
          lastError: errorMessage,
          scheduledFor: new Date(Date.now() + Math.pow(2, job.attempts) * 60 * 1000),
        },
      });
    }
  }

  return NextResponse.json({
    message: "Notification cron execution completed.",
    results,
  });
}
