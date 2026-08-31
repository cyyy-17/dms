import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email-service";
import { NotificationType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetEmail = searchParams.get("to") || "cpm.061798@gmail.com";

  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const resendKey = process.env.RESEND_API_KEY;

  const config = {
    smtpConfigured: !!(smtpUser && smtpPass),
    smtpUser: smtpUser ? smtpUser.replace(/(.{3})(.*)(@.*)/, "$1***$3") : "NOT_SET",
    resendConfigured: !!(resendKey && !resendKey.startsWith("re_placeholder")),
    timestamp: new Date().toISOString(),
  };

  const result = await sendEmail({
    recipientEmail: targetEmail,
    type: NotificationType.REGISTRATION_REQUEST_ADMIN,
    subject: "SASDMS: Email System Diagnostic Test",
    templateName: "password-reset-request",
    payload: {
      recipientName: "Diagnostic Recipient",
      resetUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://dms-drab.vercel.app"}/reset-password`,
      expirationMinutes: 15,
    },
  });

  return NextResponse.json({
    testResult: result,
    environmentConfig: config,
    sentTo: targetEmail,
  });
}
