import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { UserRole, UserStatus } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  unitId: string | null;
  unitCode: string | null;
  unitName: string | null;
  signaturePath: string | null;
}

/**
 * Validates Supabase JWT session and retrieves the active employee profile from Prisma.
 * Returns null if not authenticated or not in ACTIVE status.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
    ) {
      return null;
    }

    const supabase = await createClient();
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !authUser) {
      return null;
    }

    const profile = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { unit: true },
    });

    if (!profile || profile.status !== "ACTIVE") {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      fullName: `${profile.firstName} ${profile.lastName}`,
      role: profile.role,
      status: profile.status,
      unitId: profile.unitId,
      unitCode: profile.unit?.code || null,
      unitName: profile.unit?.name || null,
      signaturePath: profile.signaturePath,
    };
  } catch {
    return null;
  }
}

/**
 * Check if the user is currently an authorized delegate for a given unit.
 */
export async function checkActiveDelegation(
  userId: string,
  unitId: string
): Promise<boolean> {
  const now = new Date();
  const activeDelegation = await prisma.delegateSignatory.findFirst({
    where: {
      delegateId: userId,
      unitId: unitId,
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
  });

  return !!activeDelegation;
}
