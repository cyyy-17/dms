import nodemailer from "nodemailer";
import { Resend } from "resend";
import { renderNotificationEmail } from "./email-templates";
import { NotificationType } from "@prisma/client";

export interface SendEmailOptions {
  recipientId?: string;
  recipientEmail: string;
  type: NotificationType;
  subject: string;
  templateName: string;
  payload: Record<string, unknown>;
}

export interface SendEmailResult {
  success: boolean;
  provider: "SMTP" | "RESEND" | "NONE";
  messageId?: string;
  error?: string;
}

/**
 * Dispatches an email using the best available configured provider:
 * 1. SMTP (e.g. Gmail / Google Workspace App Password) - sends to ANY domain including @firstasia.edu.ph
 * 2. Resend API
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const recipient = options.recipientEmail.trim().toLowerCase();
  const rendered = renderNotificationEmail({
    type: options.type,
    templateName: options.templateName,
    subject: options.subject,
    payload: options.payload,
    recipientEmail: recipient,
  });

  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
  const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : smtpPort === 465;

  const resendApiKey = process.env.RESEND_API_KEY;
  const senderName = "SAS Document System";
  const senderEmail =
    process.env.SYSTEM_SENDER_EMAIL ||
    (smtpUser ? `"${senderName}" <${smtpUser}>` : `"${senderName}" <onboarding@resend.dev>`);

  // Provider 1: SMTP (Nodemailer) — Prioritized for unrestricted sending to any domain
  if (smtpUser && smtpPass) {
    try {
      const cleanPass = smtpPass.replace(/\s+/g, ""); // strip spaces from "xxxx xxxx xxxx xxxx" app password
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: cleanPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${smtpUser}>`,
        to: recipient,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });

      console.log(`[EMAIL_DISPATCH_SMTP] Successfully sent email to ${recipient} via SMTP. ID: ${info.messageId}`);
      return {
        success: true,
        provider: "SMTP",
        messageId: info.messageId,
      };
    } catch (smtpErr: unknown) {
      const errMsg = smtpErr instanceof Error ? smtpErr.message : String(smtpErr);
      console.error("[EMAIL_DISPATCH_SMTP_ERROR]", errMsg);
      // If Resend is also configured, fall back to Resend
      if (!resendApiKey || resendApiKey.startsWith("re_placeholder")) {
        return {
          success: false,
          provider: "SMTP",
          error: `SMTP Error: ${errMsg}`,
        };
      }
    }
  }

  // Provider 2: Resend API
  if (resendApiKey && !resendApiKey.startsWith("re_placeholder") && !resendApiKey.includes("your_resend_api_key")) {
    try {
      const resend = new Resend(resendApiKey);
      const { data: resendData, error: sendError } = await resend.emails.send({
        from: senderEmail,
        to: recipient,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });

      if (sendError) {
        console.error("[EMAIL_DISPATCH_RESEND_ERROR]", sendError);
        return {
          success: false,
          provider: "RESEND",
          error: sendError.message,
        };
      }

      console.log(`[EMAIL_DISPATCH_RESEND] Successfully sent email to ${recipient} via Resend. ID: ${resendData?.id}`);
      return {
        success: true,
        provider: "RESEND",
        messageId: resendData?.id,
      };
    } catch (resendErr: unknown) {
      const errMsg = resendErr instanceof Error ? resendErr.message : String(resendErr);
      console.error("[EMAIL_DISPATCH_RESEND_EXCEPTION]", errMsg);
      return {
        success: false,
        provider: "RESEND",
        error: errMsg,
      };
    }
  }

  return {
    success: false,
    provider: "NONE",
    error: "No email dispatch service is configured. Please provide SMTP_USER & SMTP_PASS (Gmail App Password) or RESEND_API_KEY.",
  };
}
