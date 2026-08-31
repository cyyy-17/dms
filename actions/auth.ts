"use server";

import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";
import { queueNotification } from "@/lib/notifications";
import { NotificationType } from "@prisma/client";
import { INSTITUTION_EMAIL_DOMAIN, isValidInstitutionalEmail } from "@/lib/constants";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import crypto from "crypto";

export interface RegisterInput {
  email: string;
  password?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  title?: string;
  employeeId?: string;
  unitId: string;
}

/**
 * Pre-Auth Domain Guard Registration Action
 * Enforces @firstasia.edu.ph before calling Supabase Auth admin API.
 */
export async function registerEmployee(input: RegisterInput): Promise<{
  success: boolean;
  error?: string;
}> {
  const normalizedEmail = input.email.trim().toLowerCase();

  // 1. Strict Application-Layer Domain Guard
  if (!isValidInstitutionalEmail(normalizedEmail)) {
    return {
      success: false,
      error: `Registration is restricted exclusively to official institutional email addresses ending in ${INSTITUTION_EMAIL_DOMAIN}.`,
    };
  }

  // Rate Limiting Guard
  try {
    const headerList = await headers();
    const clientIp =
      headerList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headerList.get("x-real-ip") ||
      "127.0.0.1";
    const rl = checkRateLimit(
      `register:${clientIp}`,
      RATE_LIMIT_PRESETS.AUTH_ATTEMPT.limit,
      RATE_LIMIT_PRESETS.AUTH_ATTEMPT.windowMs
    );
    if (!rl.success) {
      return {
        success: false,
        error: "Too many registration attempts. Please wait a minute before trying again.",
      };
    }
  } catch {
    // Non-blocking fallback
  }

  // 2. If running in local preview mode without live Postgres credentials
  if (!isDatabaseConfigured) {
    return { success: true };
  }

  try {
    // 3. Unit Resolution directly from live database
    const unit = await prisma.unit.findFirst({
      where: {
        OR: [
          { id: input.unitId },
          { code: input.unitId },
        ],
        isActive: true,
      },
    });

    if (!unit) {
      return {
        success: false,
        error: "Selected department unit does not exist or is inactive.",
      };
    }

    // 4. Check for Existing User in Prisma
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return {
        success: false,
        error: "An account with this institutional email is already registered.",
      };
    }

    // 5. Create User Record in Supabase Auth via Admin Service Role Client
    const tempPassword = input.password || "Password123!";
    const { data: authResult, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: tempPassword,
        email_confirm: true, // Institutional emails are pre-trusted
        user_metadata: {
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
        },
      });

    if (authError || !authResult.user) {
      // If user already exists in Supabase Auth
      if (
        authError?.message?.toLowerCase().includes("already registered") ||
        authError?.message?.toLowerCase().includes("already exists")
      ) {
        return {
          success: false,
          error: "This institutional email is already registered in the system. Please sign in.",
        };
      }

      console.error("[SUPABASE_AUTH_ADMIN_ERROR]", authError);
      return {
        success: false,
        error: authError?.message || "Failed to initialize institutional identity.",
      };
    }

    const userId = authResult.user.id;

    // 6. Create Prisma Profile in PENDING_APPROVAL status
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email: normalizedEmail,
        firstName: input.firstName.trim(),
        middleName: input.middleName?.trim() || null,
        lastName: input.lastName.trim(),
        suffix: input.suffix?.trim() || null,
        title: input.title?.trim() || null,
        employeeId: input.employeeId?.trim() || null,
        unitId: unit.id,
        role: "STAFF", // Defaults to STAFF pending Admin review
        status: "PENDING_APPROVAL",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });

    // 7. Notify All Active Admins via Background Notification Queue
    const activeAdmins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
    });

    for (const admin of activeAdmins) {
      await queueNotification({
        recipientId: admin.id,
        recipientEmail: admin.email,
        type: "REGISTRATION_REQUEST_ADMIN",
        subject: `SASDMS: New Registration Pending Approval - ${newUser.firstName} ${newUser.lastName}`,
        templateName: "admin-registration-alert",
        payload: {
          applicantName: `${newUser.firstName} ${newUser.lastName}`,
          applicantEmail: newUser.email,
          employeeId: newUser.employeeId,
          unitName: unit.name,
          applicantId: newUser.id,
        },
      });
    }

    // 8. Record Immutable Audit Event
    await logAuditEvent({
      actorId: newUser.id,
      unitId: unit.id,
      action: "USER_REGISTER",
      targetType: "USER",
      targetId: newUser.id,
      details: {
        email: newUser.email,
        unitCode: unit.code,
        employeeId: newUser.employeeId,
      },
    });

    return { success: true };
  } catch (err: unknown) {
    console.error("[REGISTRATION_DB_ERROR]", err);
    const errorMessage = err instanceof Error ? err.message : "Error during registration.";
    return {
      success: false,
      error: `Registration failed: ${errorMessage}`,
    };
  }
}

/**
 * Login Employee Action
 */
export async function loginEmployee(formData: {
  email: string;
  password: string;
}): Promise<{
  success: boolean;
  error?: string;
  status?: string;
  user?: {
    firstName: string;
    lastName: string;
    role: string;
    unitCode: string | null;
    unitName: string | null;
  };
}> {
  const normalizedEmail = formData.email.trim().toLowerCase();

  // Strict Domain Check
  if (!isValidInstitutionalEmail(normalizedEmail)) {
    return {
      success: false,
      error: `Access is restricted to official @firstasia.edu.ph institutional accounts.`,
    };
  }

  // Rate Limiting Guard
  try {
    const headerList = await headers();
    const clientIp =
      headerList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headerList.get("x-real-ip") ||
      "127.0.0.1";
    const rl = checkRateLimit(
      `login:${clientIp}:${normalizedEmail}`,
      RATE_LIMIT_PRESETS.AUTH_ATTEMPT.limit,
      RATE_LIMIT_PRESETS.AUTH_ATTEMPT.windowMs
    );
    if (!rl.success) {
      return {
        success: false,
        error: "Too many login attempts. Please wait a minute before trying again.",
      };
    }
  } catch {
    // Non-blocking fallback
  }

  // Check if live database credentials are present
  if (!isDatabaseConfigured) {
    return {
      success: false,
      error: "Database configuration is missing. Please configure DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY in your Vercel Project Settings.",
    };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: formData.password,
    });

    if (error || !data.user) {
      return {
        success: false,
        error: error?.message || "Invalid email or password.",
      };
    }

    // Check Profile Status in Prisma
    const profile = await prisma.user.findFirst({
      where: {
        OR: [
          { id: data.user.id },
          { email: normalizedEmail },
        ],
      },
    });

    if (!profile) {
      await supabase.auth.signOut();
      return { success: false, error: "User profile not found in system." };
    }

    if (profile.status === "PENDING_APPROVAL") {
      await supabase.auth.signOut();
      return {
        success: false,
        status: "PENDING_APPROVAL",
        error: "Your registration is pending Admin review and approval.",
      };
    }

    if (profile.status === "REJECTED" || profile.status === "SUSPENDED") {
      await supabase.auth.signOut();
      return {
        success: false,
        error: `Your account is ${profile.status.toLowerCase()}. Please contact system administrators.`,
      };
    }

    const userUnit = profile.unitId
      ? await prisma.unit.findUnique({ where: { id: profile.unitId } })
      : null;

    revalidatePath("/", "layout");
    return {
      success: true,
      status: profile.status,
      user: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        role: profile.role,
        unitCode: userUnit?.code || null,
        unitName: userUnit?.name || null,
      },
    };
  } catch (err) {
    console.error("[LOGIN_ERROR]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Authentication error: ${msg}`,
    };
  }
}

/**
 * Sign Out Action
 */
export async function signOutAction() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore error if offline or placeholder session
  }
  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Save User Electronic Signature (Uploads to signatures-private bucket and updates User profile)
 */
export async function saveUserSignatureAction(base64DataUrl: string): Promise<{
  success: boolean;
  signaturePath?: string;
  signatureHash?: string;
  error?: string;
}> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  try {
    const base64Data = base64DataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const signatureHash = crypto.createHash("sha256").update(buffer).digest("hex");
    const filename = `signatures/${currentUser.id}/sig_${Date.now()}.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("signatures-private")
      .upload(filename, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("[SIGNATURE_UPLOAD_ERROR]", uploadError);
      return { success: false, error: uploadError.message };
    }

    if (isDatabaseConfigured) {
      await prisma.user.update({
        where: { id: currentUser.id },
        data: { signaturePath: filename },
      });

      await logAuditEvent({
        actorId: currentUser.id,
        unitId: currentUser.unitId,
        action: "USER_ROLE_CHANGE",
        targetType: "USER",
        targetId: currentUser.id,
        details: {
          actionType: "SIGNATURE_UPDATED",
          signaturePath: filename,
          signatureHash,
          byteLength: buffer.length,
        },
      });
    }

    revalidatePath("/dashboard", "layout");
    return { success: true, signaturePath: filename, signatureHash };
  } catch (err: unknown) {
    console.error("[SAVE_SIGNATURE_ERROR]", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to save signature." };
  }
}

/**
 * Generate temporary signed URL for an electronic signature
 */
export async function getSignedSignatureUrlAction(storagePath: string): Promise<{
  success: boolean;
  signedUrl?: string;
  error?: string;
}> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  // Authorization & Tenancy Guard:
  // User can access their own signature, or Directors/Admins/Signatories reviewing associated workflows
  const isOwnSignature = storagePath.includes(`signatures/${currentUser.id}/`);
  const isPrivileged = currentUser.role === "ADMIN" || currentUser.role === "DIRECTOR";

  if (!isOwnSignature && !isPrivileged) {
    return {
      success: false,
      error: "Access denied. You do not have permission to view this signature asset.",
    };
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from("signatures-private")
      .createSignedUrl(storagePath, 60 * 30); // 30 minutes validity

    if (error || !data?.signedUrl) {
      return { success: false, error: error?.message || "Failed to generate signature URL." };
    }

    return { success: true, signedUrl: data.signedUrl };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Error generating URL." };
  }
}

/**
 * Update Self Profile Details (First Name, Last Name, Employee ID)
 */
export async function updateUserProfileDetailsAction(input: {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  title?: string;
  employeeId?: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  const cleanFirstName = input.firstName.trim();
  const cleanMiddleName = input.middleName?.trim() || null;
  const cleanLastName = input.lastName.trim();
  const cleanSuffix = input.suffix?.trim() || null;
  const cleanTitle = input.title?.trim() || null;
  const cleanEmployeeId = input.employeeId?.trim() || null;

  if (!cleanFirstName || !cleanLastName) {
    return { success: false, error: "First and last names are strictly mandatory." };
  }

  try {
    if (isDatabaseConfigured) {
      // Check if employeeId is provided and not taken by another user
      if (cleanEmployeeId) {
        const existing = await prisma.user.findFirst({
          where: {
            employeeId: cleanEmployeeId,
            id: { not: currentUser.id },
          },
        });
        if (existing) {
          return { success: false, error: "This Employee ID is already associated with another account." };
        }
      }

      await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          firstName: cleanFirstName,
          middleName: cleanMiddleName,
          lastName: cleanLastName,
          suffix: cleanSuffix,
          title: cleanTitle,
          employeeId: cleanEmployeeId,
        } as Parameters<typeof prisma.user.update>[0]["data"],
      });

      // Update Supabase Auth user metadata
      try {
        await supabaseAdmin.auth.admin.updateUserById(currentUser.id, {
          user_metadata: {
            firstName: cleanFirstName,
            middleName: cleanMiddleName,
            lastName: cleanLastName,
            suffix: cleanSuffix,
            title: cleanTitle,
          },
        });
      } catch {
        // Continue if metadata sync is soft-failed
      }

      await logAuditEvent({
        actorId: currentUser.id,
        unitId: currentUser.unitId,
        action: "USER_ROLE_CHANGE",
        targetType: "USER",
        targetId: currentUser.id,
        details: {
          actionType: "PROFILE_DETAILS_UPDATED",
          firstName: cleanFirstName,
          middleName: cleanMiddleName,
          lastName: cleanLastName,
          suffix: cleanSuffix,
          title: cleanTitle,
          employeeId: cleanEmployeeId,
        },
      });
    }

    revalidatePath("/dashboard/profile", "page");
    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (err: unknown) {
    console.error("[UPDATE_PROFILE_ERROR]", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to update profile." };
  }
}

/**
 * Update Self Password with Mandatory Auto-Logout
 */
export async function updateUserPasswordAction(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{
  success: boolean;
  error?: string;
  loggedOut?: boolean;
}> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  const { currentPassword, newPassword, confirmPassword } = input;

  if (!currentPassword) {
    return { success: false, error: "Current password is strictly required to update your credentials." };
  }

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "New password must contain at least 8 characters." };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "New password and confirmation do not match." };
  }

  try {
    const supabase = await createClient();

    // Mandatory current password verification against Supabase Auth
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: currentPassword,
    });

    if (verifyError) {
      return { success: false, error: "Current password verification failed. Please check your credentials." };
    }

    // Update password via Supabase Admin
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(currentUser.id, {
      password: newPassword,
    });

    if (updateError) {
      console.error("[PASSWORD_UPDATE_AUTH_ERROR]", updateError);
      return { success: false, error: updateError.message || "Failed to update password." };
    }

    if (isDatabaseConfigured) {
      await logAuditEvent({
        actorId: currentUser.id,
        unitId: currentUser.unitId,
        action: "USER_ROLE_CHANGE",
        targetType: "USER",
        targetId: currentUser.id,
        details: { actionType: "PASSWORD_CHANGED_SELF_LOGOUT" },
      });
    }

    // Invalidate and sign out current session
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore if session already terminated
    }

    revalidatePath("/", "layout");
    return { success: true, loggedOut: true };
  } catch (err: unknown) {
    console.error("[PASSWORD_UPDATE_ERROR]", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to update password." };
  }
}

/**
 * Request Password Reset Action (Self-Service Forgot Password)
 * Dispatches an institutional recovery email with anti-enumeration protection.
 */
export async function requestPasswordResetAction(email: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  previewLink?: string;
}> {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Strict Institutional Domain Guard
  if (!isValidInstitutionalEmail(normalizedEmail)) {
    return {
      success: false,
      error: `Password reset is restricted exclusively to official institutional accounts ending in ${INSTITUTION_EMAIL_DOMAIN}.`,
    };
  }

  // 2. Rate Limiting Guard
  try {
    const headerList = await headers();
    const clientIp =
      headerList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headerList.get("x-real-ip") ||
      "127.0.0.1";
    const rl = checkRateLimit(
      `pwd-reset:${clientIp}:${normalizedEmail}`,
      RATE_LIMIT_PRESETS.AUTH_ATTEMPT.limit,
      RATE_LIMIT_PRESETS.AUTH_ATTEMPT.windowMs
    );
    if (!rl.success) {
      return {
        success: false,
        error: "Too many password reset requests. Please wait a few minutes before trying again.",
      };
    }
  } catch {
    // Non-blocking fallback
  }

  const genericSuccessMessage =
    "If an active account exists for this institutional email, a password reset link has been dispatched to your inbox.";

  if (!isDatabaseConfigured) {
    return {
      success: true,
      message: genericSuccessMessage,
      previewLink: "/reset-password?preview=true",
    };
  }

  try {
    // 3. User verification in Prisma database
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Anti-enumeration: If user does not exist or is not active, return generic success
    if (!user || user.status !== "ACTIVE") {
      return {
        success: true,
        message: genericSuccessMessage,
      };
    }

    // 4. Generate recovery link using Supabase Admin Auth
    const hostHeader = (await headers()).get("host");
    const forwardedProto = (await headers()).get("x-forwarded-proto");
    const isLocalhost = !hostHeader || hostHeader.includes("localhost") || hostHeader.includes("127.0.0.1");
    const proto = forwardedProto || (isLocalhost ? "http" : "https");

    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl || baseUrl === "http://localhost:3000") {
      if (hostHeader && !isLocalhost) {
        baseUrl = `${proto}://${hostHeader}`;
      } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
        baseUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
      } else if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      } else if (hostHeader) {
        baseUrl = `${proto}://${hostHeader}`;
      } else {
        baseUrl = "http://localhost:3000";
      }
    }
    baseUrl = baseUrl.replace(/\/$/, "");

    let actionLink = `${baseUrl}/reset-password`;

    try {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: normalizedEmail,
        options: {
          redirectTo: `${baseUrl}/auth/callback?next=/reset-password`,
        },
      });

      if (!linkError && linkData?.properties?.action_link) {
        actionLink = linkData.properties.action_link;
        // If Supabase generated a link with localhost, replace it with the deployed baseUrl
        if (baseUrl !== "http://localhost:3000" && !baseUrl.includes("127.0.0.1")) {
          actionLink = actionLink.replace(/http:\/\/(localhost|127\.0\.0\.1):3000/g, baseUrl);
        }
      }
    } catch (e) {
      console.warn("[SUPABASE_GENERATE_LINK_WARNING]", e);
    }

    // 5. Enqueue branded email notification
    await queueNotification({
      recipientId: user.id,
      recipientEmail: user.email,
      type: NotificationType.REGISTRATION_REQUEST_ADMIN,
      subject: "SASDMS: Institutional Password Reset Request",
      templateName: "password-reset-request",
      payload: {
        recipientName: `${user.firstName} ${user.lastName}`,
        resetUrl: actionLink,
        expirationMinutes: 15,
      },
    });

    // 6. Log security audit event
    await logAuditEvent({
      actorId: user.id,
      unitId: user.unitId,
      action: "USER_ROLE_CHANGE",
      targetType: "USER",
      targetId: user.id,
      details: {
        actionType: "PASSWORD_RESET_REQUESTED",
        email: user.email,
      },
    });

    return {
      success: true,
      message: genericSuccessMessage,
      previewLink: process.env.NODE_ENV === "development" ? actionLink : undefined,
    };
  } catch (err: unknown) {
    console.error("[REQUEST_PASSWORD_RESET_ERROR]", err);
    return {
      success: false,
      error: "An unexpected error occurred while processing your request. Please try again.",
    };
  }
}

/**
 * Confirm and Apply New Password
 * Works for users recovering via recovery session or authenticated token.
 */
export async function resetPasswordConfirmAction(input: {
  newPassword: string;
  confirmPassword: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  const { newPassword, confirmPassword } = input;

  if (!newPassword || newPassword.length < 8) {
    return {
      success: false,
      error: "New password must contain at least 8 characters.",
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      success: false,
      error: "New password and confirmation do not match.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "Your password reset session has expired or is invalid. Please request a new reset link.",
      };
    }

    // Update password on Supabase
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("[PASSWORD_RESET_UPDATE_ERROR]", updateError);
      return {
        success: false,
        error: updateError.message || "Failed to update password.",
      };
    }

    if (isDatabaseConfigured) {
      const profile = await prisma.user.findUnique({ where: { id: user.id } });
      await logAuditEvent({
        actorId: user.id,
        unitId: profile?.unitId || null,
        action: "USER_ROLE_CHANGE",
        targetType: "USER",
        targetId: user.id,
        details: { actionType: "PASSWORD_RESET_COMPLETED_SELF", email: user.email },
      });
    }

    // Invalidate / sign out recovery session so user signs in cleanly
    try {
      await supabase.auth.signOut();
    } catch {
      // Non-blocking
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: unknown) {
    console.error("[RESET_PASSWORD_CONFIRM_ERROR]", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reset password.",
    };
  }
}
