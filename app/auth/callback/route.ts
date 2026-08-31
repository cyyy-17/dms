import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

  const cookieStore = await cookies();
  const response = NextResponse.redirect(new URL(next, requestUrl.origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Ignore if called from response
            }
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 1. Direct Token Hash verification
  if (tokenHash && type) {
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type,
      });

      if (verifyError) {
        console.error("[AUTH_VERIFY_OTP_ERROR]", verifyError);
        return NextResponse.redirect(
          new URL(
            `/forgot-password?error=${encodeURIComponent("This password reset link has expired or was superseded by a newer request. Please request a new one.")}`,
            requestUrl.origin
          )
        );
      }

      return response;
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

      return response;
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

  return response;
}
