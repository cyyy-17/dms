import "dotenv/config";
import { dispatchImmediateNotification } from "../lib/notifications";
import { NotificationType } from "@prisma/client";

async function testImmediate() {
  console.log("=== Testing dispatchImmediateNotification ===");
  console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.slice(0, 8)}...` : "NOT FOUND");
  console.log("SYSTEM_SENDER_EMAIL:", process.env.SYSTEM_SENDER_EMAIL);

  const res = await dispatchImmediateNotification({
    recipientId: "707957ae-e67e-4e9c-95e9-f71fb7074bc1",
    recipientEmail: "cpm.061798@gmail.com",
    type: NotificationType.REGISTRATION_REQUEST_ADMIN,
    subject: "SASDMS: Immediate Password Reset Verification",
    templateName: "password-reset-request",
    payload: {
      recipientName: "Cyrell Peter Mercado",
      resetUrl: "https://your-deployed-app.vercel.app/reset-password",
      expirationMinutes: 15,
    },
  });

  console.log("Result from dispatchImmediateNotification:", res);
}

testImmediate().catch(console.error);
