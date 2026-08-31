import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.SYSTEM_SENDER_EMAIL || "SAS Document System <onboarding@resend.dev>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "NOT_SET";
  const vercelUrl = process.env.VERCEL_URL || "NOT_SET";
  const vercelProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || "NOT_SET";

  const diagnostics = {
    hasResendApiKey: !!apiKey,
    resendApiKeyPrefix: apiKey ? `${apiKey.substring(0, 8)}... (length: ${apiKey.length})` : "MISSING",
    senderEmail: sender,
    appUrl,
    vercelUrl,
    vercelProdUrl,
    timestamp: new Date().toISOString(),
  };

  if (!apiKey || apiKey.startsWith("re_placeholder") || apiKey.includes("your_resend_api_key")) {
    return NextResponse.json(
      {
        success: false,
        error: "RESEND_API_KEY is not defined or is a placeholder in this Vercel deployment's environment variables.",
        diagnostics,
      },
      { status: 500 }
    );
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: sender,
      to: "cpm.061798@gmail.com",
      subject: "SASDMS: Vercel Live Deployment Diagnostic Test",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0F2962;">Live Vercel Resend Verification</h2>
          <p>This email confirms that your Vercel serverless function has active, working access to Resend!</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
      `,
      text: `Live Vercel Resend Verification - Timestamp: ${new Date().toISOString()}`,
    });

    if (result.error) {
      return NextResponse.json(
        {
          success: false,
          resendError: result.error,
          diagnostics,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Resend email dispatched successfully from live Vercel environment!",
      resendId: result.data?.id,
      diagnostics,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        exception: msg,
        diagnostics,
      },
      { status: 500 }
    );
  }
}
