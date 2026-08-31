import "dotenv/config";
import { prisma } from "../lib/prisma";
import { Resend } from "resend";
import { renderNotificationEmail } from "../lib/email-templates";

async function sendPendingNow() {
  const pending = await prisma.notificationQueue.findFirst({
    where: { recipientEmail: "cpm.061798@gmail.com", status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  if (!pending) {
    console.log("No pending notifications found.");
    return;
  }

  console.log("Found pending notification:", pending.id);
  const payload = pending.payload as Record<string, unknown>;
  console.log("Payload:", payload);

  const resend = new Resend(process.env.RESEND_API_KEY);
  const sender = process.env.SYSTEM_SENDER_EMAIL || "SAS Document System <onboarding@resend.dev>";

  const rendered = renderNotificationEmail({
    type: pending.type,
    templateName: pending.templateName,
    subject: pending.subject,
    payload,
    recipientEmail: pending.recipientEmail,
  });

  console.log(`Dispatching via Resend from "${sender}" to "${pending.recipientEmail}"...`);
  const { data, error } = await resend.emails.send({
    from: sender,
    to: pending.recipientEmail,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });

  if (error) {
    console.error("Resend error:", error);
  } else {
    console.log("✓ Successfully dispatched pending email! Resend ID:", data?.id);
    await prisma.notificationQueue.update({
      where: { id: pending.id },
      data: { status: "SENT", sentAt: new Date(), attempts: 1 },
    });
  }
}

sendPendingNow().catch(console.error).finally(() => prisma.$disconnect());
