import "dotenv/config";
import { Resend } from "resend";
import { NotificationType } from "@prisma/client";
import { renderNotificationEmail } from "../lib/email-templates";

async function testPersonalEmail() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Missing RESEND_API_KEY");
    return;
  }

  const resend = new Resend(apiKey);
  const recipientEmail = "cpm.061798@gmail.com";
  const sender = process.env.SYSTEM_SENDER_EMAIL || "SAS Document System <onboarding@resend.dev>";

  console.log(`Rendering password reset notification email for ${recipientEmail}...`);
  const rendered = renderNotificationEmail({
    type: NotificationType.REGISTRATION_REQUEST_ADMIN,
    templateName: "password-reset-request",
    subject: "SASDMS: Test Password Reset Notification",
    recipientEmail,
    payload: {
      recipientName: "Cyrell Peter Mercado",
      resetUrl: "http://localhost:3000/reset-password",
      expirationMinutes: 15,
    },
  });

  console.log(`Sending email via Resend API from ${sender}...`);
  const { data, error } = await resend.emails.send({
    from: sender,
    to: recipientEmail,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });

  if (error) {
    console.error("Resend API error:", error);
  } else {
    console.log("✓ Email successfully dispatched! Resend ID:", data?.id);
  }
}

testPersonalEmail().catch(console.error);
