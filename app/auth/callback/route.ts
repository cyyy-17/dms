import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = requestUrl.searchParams.get("next") || "/reset-password";
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (error) {
    console.error("[AUTH_CALLBACK_ERROR]", error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    );
  }

  // 1. Direct Token Hash verification (Bypasses Supabase Site URL redirects entirely)
  if (tokenHash && type) {
    try {
      const supabase = await createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type,
      });

      if (verifyError) {
        console.error("[AUTH_VERIFY_OTP_ERROR]", verifyError);
        return NextResponse.redirect(
          new URL(
            `/forgot-password?error=${encodeURIComponent("Password reset link has expired or is invalid. Please request a new one.")}`,
            requestUrl.origin
          )
        );
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    } catch (err) {
      console.error("[AUTH_VERIFY_OTP_EXCEPTION]", err);
      return NextResponse.redirect(
        new URL(
          `/forgot-password?error=${encodeURIComponent("Failed to process recovery authorization.")}`,
          requestUrl.origin
        )
      );
    }
  }

  // 2. PKCE Authorization Code exchange
  if (code) {
    try {
      const supabase = await createClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        console.error("[AUTH_EXCHANGE_CODE_ERROR]", exchangeError);
        return NextResponse.redirect(
          new URL(
            `/forgot-password?error=${encodeURIComponent("Password reset link has expired or is invalid. Please request a new one.")}`,
            requestUrl.origin
          )
        );
      }
    } catch (err) {
      console.error("[AUTH_CALLBACK_EXCEPTION]", err);
      return NextResponse.redirect(
        new URL(
          `/forgot-password?error=${encodeURIComponent("Failed to process recovery authorization.")}`,
          requestUrl.origin
        )
      );
    }
  }

  // Redirect to target destination (default: /reset-password)
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
