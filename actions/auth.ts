"use server";

import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";
import { queueNotification } from "@/lib/notifications";
import { INSTITUTION_EMAIL_DOMAIN, SEED_UNITS } from "@/lib/constants";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface RegisterInput {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
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
  if (!normalizedEmail.endsWith(INSTITUTION_EMAIL_DOMAIN)) {
    return {
      success: false,
      error: `Registration is restricted exclusively to official institutional email addresses ending in ${INSTITUTION_EMAIL_DOMAIN}.`,
    };
  }

  // 2. If running in local preview mode without live Postgres credentials
  if (!isDatabaseConfigured) {
    return { success: true };
  }

  try {
    // 3. Robust Unit Resolution (by ID, Code, or fallback placeholder)
    let unit = await prisma.unit.findFirst({
      where: {
        OR: [
          { id: input.unitId },
          { code: input.unitId },
        ],
        isActive: true,
      },
    });

    // If submitted from a stale client cache with "placeholder-unit-X"
    if (!unit && input.unitId.startsWith("placeholder-unit-")) {
      const idx = parseInt(input.unitId.replace("placeholder-unit-", ""), 10) - 1;
      const targetCode = SEED_UNITS[idx]?.code || SEED_UNITS[0].code;
      unit = await prisma.unit.findUnique({
        where: { code: targetCode },
      });
    }

    // Default to first active unit if still not resolved
    if (!unit) {
      unit = await prisma.unit.findFirst({
        where: { isActive: true },
        orderBy: { name: "asc" },
      });
    }

    if (!unit) {
      return {
        success: false,
        error: "No active department units found in system.",
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
        lastName: input.lastName.trim(),
        employeeId: input.employeeId?.trim() || null,
        unitId: unit.id,
        role: "STAFF", // Defaults to STAFF pending Admin review
        status: "PENDING_APPROVAL",
      },
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
}> {
  const normalizedEmail = formData.email.trim().toLowerCase();

  // Strict Domain Check
  if (!normalizedEmail.endsWith(INSTITUTION_EMAIL_DOMAIN)) {
    return {
      success: false,
      error: `Access is restricted to official @firstasia.edu.ph institutional accounts.`,
    };
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

    revalidatePath("/", "layout");
    return { success: true, status: profile.status };
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
  error?: string;
}> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  try {
    const base64Data = base64DataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
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
        details: { actionType: "SIGNATURE_UPDATED", signaturePath: filename },
      });
    }

    revalidatePath("/dashboard", "layout");
    return { success: true, signaturePath: filename };
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
  currentPassword?: string;
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

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "New password must contain at least 8 characters." };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "New password and confirmation do not match." };
  }

  try {
    const supabase = await createClient();

    // Verify current password if provided
    if (currentPassword) {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword,
      });

      if (verifyError) {
        return { success: false, error: "Current password verification failed. Please check your credentials." };
      }
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
