"use server";

import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit";
import { queueNotification } from "@/lib/notifications";
import { INSTITUTION_EMAIL_DOMAIN } from "@/lib/constants";
import {
  UserRole,
  UserStatus,
  ApprovalLevel,
  DocumentStatus,
  NotificationStatus,
  ApprovalActionType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

// ════════════════════════════════════════════════════════════════════════════
// 1. USER & EMPLOYEE MANAGEMENT CRUD ACTIONS
// ════════════════════════════════════════════════════════════════════════════

export interface CreateUserDirectInput {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  employeeId?: string;
  role: UserRole;
  unitId?: string;
}

/**
 * Direct Employee Provisioning by Admin
 */
export async function createUserDirectAction(input: CreateUserDirectInput): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
}> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const normalizedEmail = input.email.trim().toLowerCase();

  if (!normalizedEmail.endsWith(INSTITUTION_EMAIL_DOMAIN)) {
    return {
      success: false,
      error: `Email must belong to ${INSTITUTION_EMAIL_DOMAIN}.`,
    };
  }

  if (!isDatabaseConfigured) {
    return { success: true, userId: "mock-new-user-id" };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return { success: false, error: "An employee with this email already exists." };
    }

    const tempPassword = input.password || "FaithSAS2026!Temporary";
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
      },
    });

    if (authError || !authUser.user) {
      return { success: false, error: authError?.message || "Failed to create auth identity." };
    }

    const user = await prisma.user.create({
      data: {
        id: authUser.user.id,
        email: normalizedEmail,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        employeeId: input.employeeId?.trim() || null,
        role: input.role,
        unitId: input.unitId || null,
        status: UserStatus.ACTIVE,
        approvedById: currentUser.id,
        approvedAt: new Date(),
      },
      include: { unit: true },
    });

    await logAuditEvent({
      actorId: currentUser.id,
      unitId: input.unitId || null,
      action: "USER_REGISTER",
      targetType: "USER",
      targetId: user.id,
      details: {
        provisionedDirectly: true,
        email: user.email,
        role: user.role,
        unitName: user.unit?.name,
      },
    });

    revalidatePath("/dashboard/admin/users");
    return { success: true, userId: user.id };
  } catch (err: unknown) {
    console.error("[ADMIN_CREATE_USER_ERROR]", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to create user." };
  }
}

/**
 * Approve a pending employee registration
 */
export async function approveUserAction(params: {
  userId: string;
  role: UserRole;
  unitId: string;
}): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  if (!isDatabaseConfigured) {
    return { success: true };
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: {
        status: UserStatus.ACTIVE,
        role: params.role,
        unitId: params.unitId,
        approvedById: currentUser.id,
        approvedAt: new Date(),
      },
      include: { unit: true },
    });

    await queueNotification({
      recipientId: updatedUser.id,
      recipientEmail: updatedUser.email,
      type: "ACCOUNT_APPROVED",
      subject: "SASDMS: Your Account Registration has been Approved",
      templateName: "account-approved",
      payload: {
        userName: `${updatedUser.firstName} ${updatedUser.lastName}`,
        role: updatedUser.role,
        unitName: updatedUser.unit?.name || "General Unit",
      },
    });

    await logAuditEvent({
      actorId: currentUser.id,
      unitId: params.unitId,
      action: "USER_APPROVE",
      targetType: "USER",
      targetId: updatedUser.id,
      details: {
        approvedEmail: updatedUser.email,
        assignedRole: params.role,
        assignedUnitId: params.unitId,
      },
    });

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (error) {
    console.error("[ADMIN_APPROVE_ERROR]", error);
    return { success: false, error: "Failed to approve user registration." };
  }
}

/**
 * Reject a pending employee registration
 */
export async function rejectUserAction(params: {
  userId: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  if (!isDatabaseConfigured) {
    return { success: true };
  }

  try {
    const user = await prisma.user.update({
      where: { id: params.userId },
      data: {
        status: UserStatus.REJECTED,
      },
    });

    await queueNotification({
      recipientId: user.id,
      recipientEmail: user.email,
      type: "ACCOUNT_REJECTED",
      subject: "SASDMS: Account Registration Status Update",
      templateName: "account-rejected",
      payload: {
        userName: `${user.firstName} ${user.lastName}`,
        reason: params.reason,
      },
    });

    await logAuditEvent({
      actorId: currentUser.id,
      action: "USER_REJECT",
      targetType: "USER",
      targetId: user.id,
      details: { reason: params.reason, email: user.email },
    });

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (error) {
    console.error("[ADMIN_REJECT_ERROR]", error);
    return { success: false, error: "Failed to reject user." };
  }
}

/**
 * Update user details (Name, Employee ID, Role, Unit, Status)
 */
export async function updateUserRoleUnitAction(params: {
  userId: string;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  role: UserRole;
  unitId: string | null;
  status?: UserStatus;
}): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  if (!isDatabaseConfigured) {
    return { success: true };
  }

  try {
    const updated = await prisma.user.update({
      where: { id: params.userId },
      data: {
        ...(params.firstName ? { firstName: params.firstName.trim() } : {}),
        ...(params.lastName ? { lastName: params.lastName.trim() } : {}),
        ...(params.employeeId !== undefined ? { employeeId: params.employeeId?.trim() || null } : {}),
        role: params.role,
        unitId: params.unitId || null,
        ...(params.status ? { status: params.status } : {}),
      },
    });

    await logAuditEvent({
      actorId: currentUser.id,
      unitId: params.unitId,
      action: "USER_ROLE_CHANGE",
      targetType: "USER",
      targetId: updated.id,
      details: { newRole: params.role, newUnitId: params.unitId, status: params.status },
    });

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (error) {
    console.error("[ADMIN_UPDATE_USER_ERROR]", error);
    return { success: false, error: "Failed to update user." };
  }
}

/**
 * Suspend an active employee account
 */
export async function suspendUserAction(userId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  if (!isDatabaseConfigured) {
    return { success: true };
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.SUSPENDED },
    });

    await logAuditEvent({
      actorId: currentUser.id,
      action: "USER_SUSPEND",
      targetType: "USER",
      targetId: user.id,
      details: { email: user.email, reason },
    });

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (error) {
    console.error("[ADMIN_SUSPEND_USER_ERROR]", error);
    return { success: false, error: "Failed to suspend user." };
  }
}

/**
 * Reactivate a suspended employee account
 */
export async function reactivateUserAction(userId: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  if (!isDatabaseConfigured) {
    return { success: true };
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE },
    });

    await logAuditEvent({
      actorId: currentUser.id,
      action: "USER_APPROVE",
      targetType: "USER",
      targetId: user.id,
      details: { actionType: "REACTIVATION", email: user.email },
    });

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (error) {
    console.error("[ADMIN_REACTIVATE_USER_ERROR]", error);
    return { success: false, error: "Failed to reactivate user." };
  }
}

/**
 * Admin Password Reset for Employee
 */
export async function resetUserPasswordAction(params: {
  userId: string;
  newPassword?: string;
}): Promise<{ success: boolean; temporaryPassword?: string; error?: string }> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const passwordToSet = params.newPassword || `FaithSAS${new Date().getFullYear()}!${Math.floor(1000 + Math.random() * 9000)}`;

  if (!isDatabaseConfigured) {
    return { success: true, temporaryPassword: passwordToSet };
  }

  try {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(params.userId, {
      password: passwordToSet,
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    const user = await prisma.user.findUnique({ where: { id: params.userId } });

    await logAuditEvent({
      actorId: currentUser.id,
      action: "USER_ROLE_CHANGE",
      targetType: "USER",
      targetId: params.userId,
      details: { actionType: "PASSWORD_RESET", email: user?.email },
    });

    return { success: true, temporaryPassword: passwordToSet };
  } catch (error) {
    console.error("[ADMIN_RESET_PASSWORD_ERROR]", error);
    return { success: false, error: "Failed to reset password." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 2. DEPARTMENT UNITS MANAGEMENT CRUD ACTIONS
// ════════════════════════════════════════════════════════════════════════════

export interface UnitInput {
  id?: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export async function createUnitAction(input: UnitInput): Promise<{ success: boolean; unitId?: string; error?: string }> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { success: false, error: "Unauthorized." };
  }

  if (!isDatabaseConfigured) {
    return { success: true, unitId: "mock-unit-id" };
  }

  try {
    const upperCode = input.code.trim().toUpperCase();
    const existing = await prisma.unit.findUnique({ where: { code: upperCode } });
    if (existing) {
      return { success: false, error: `Unit code '${upperCode}' already exists.` };
    }

    const unit = await prisma.unit.create({
      data: {
        code: upperCode,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        isActive: input.isActive ?? true,
      },
    });

    await logAuditEvent({
      actorId: currentUser.id,
      unitId: unit.id,
      action: "USER_ROLE_CHANGE",
      targetType: "CONFIG",
      targetId: unit.id,
      details: { actionType: "UNIT_CREATE", code: unit.code, name: unit.name },
    });

    revalidatePath("/dashboard/admin/units");
    revalidatePath("/dashboard/documents");
    return { success: true, unitId: unit.id };
  } catch (err: unknown) {
    console.error("[CREATE_UNIT_ERROR]", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to create unit." };
  }
}

export async function updateUnitAction(input: UnitInput): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN" || !input.id) {
    return { success: false, error: "Unauthorized or unit ID missing." };
  }

  if (!isDatabaseConfigured) {
    return { success: true };
  }

  try {
    const upperCode = input.code.trim().toUpperCase();
    const unit = await prisma.unit.update({
      where: { id: input.id },
      data: {
        code: upperCode,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });

    await logAuditEvent({
      actorId: currentUser.id,
      unitId: unit.id,
      action: "USER_ROLE_CHANGE",
      targetType: "CONFIG",
      targetId: unit.id,
      details: { actionType: "UNIT_UPDATE", code: unit.code, name: unit.name, isActive: unit.isActive },
    });

    revalidatePath("/dashboard/admin/units");
    return { success: true };
  } catch (err: unknown) {
    console.error("[UPDATE_UNIT_ERROR]", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to update unit." };
  }
}

export async function toggleUnitStatusAction(unitId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { success: false, error: "Unauthorized." };
  }

  if (!isDatabaseConfigured) {
    return { success: true };
  }

  try {
    const unit = await prisma.unit.update({
      where: { id: unitId },
      data: { isActive },
    });

    await logAuditEvent({
      actorId: currentUser.id,
      unitId: unit.id,
      action: "USER_ROLE_CHANGE",
      targetType: "CONFIG",
      targetId: unit.id,
      details: { actionType: isActive ? "UNIT_ACTIVATE" : "UNIT_DEACTIVATE", code: unit.code, isActive },
    });

    revalidatePath("/dashboard/admin/units");
    return { success: true };
  } catch (err: unknown) {
    console.error("[TOGGLE_UNIT_STATUS_ERROR]", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to update unit status." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 3. DOCUMENT CLASSIFICATION TYPES CRUD ACTIONS
// ════════════════════════════════════════════════════════════════════════════

export interface DocumentTypeInput {
  id?: string;
  code: string;
  name: string;
  description?: string;
  defaultApprovalLevel: ApprovalLevel;
  requiresExpiryTracking: boolean;
  defaultRetentionDays: number;
  isActive?: boolean;
}

export async function createDocumentTypeAction(input: DocumentTypeInput): Promise<{ success: boolean; typeId?: string; error?: string }> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { success: false, error: "Unauthorized." };
  }

  if (!isDatabaseConfigured) {
    return { success: true, typeId: "mock-doc-type-id" };
  }

  try {
    const upperCode = input.code.trim().toUpperCase();
    const existing = await prisma.documentType.findUnique({ where: { code: upperCode } });
    if (existing) {
      return { success: false, error: `Document type code '${upperCode}' already exists.` };
    }

    const docType = await prisma.documentType.create({
      data: {
        code: upperCode,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        defaultApprovalLevel: input.defaultApprovalLevel,
        requiresExpiryTracking: input.requiresExpiryTracking,
        defaultRetentionDays: input.defaultRetentionDays || 365,
        isActive: input.isActive ?? true,
      },
    });

    await logAuditEvent({
      actorId: currentUser.id,
      action: "USER_ROLE_CHANGE",
      targetType: "CONFIG",
      targetId: docType.id,
      details: {
        actionType: "DOC_TYPE_CREATE",
        code: docType.code,
        name: docType.name,
        approvalLevel: docType.defaultApprovalLevel,
        retentionDays: docType.defaultRetentionDays,
      },
    });

    revalidatePath("/dashboard/admin/document-types");
    revalidatePath("/dashboard/documents");
    return { success: true, typeId: docType.id };
  } catch (err: unknown) {
    console.error("[CREATE_DOC_TYPE_ERROR]", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to create document type." };
  }
}

export async function updateDocumentTypeAction(input: DocumentTypeInput): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN" || !input.id) {
    return { success: false, error: "Unauthorized or document type ID missing." };
  }

  if (!isDatabaseConfigured) {
    return { success: true };
  }

  try {
    const upperCode = input.code.trim().toUpperCase();
    const docType = await prisma.documentType.update({
      where: { id: input.id },
      data: {
        code: upperCode,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        defaultApprovalLevel: input.defaultApprovalLevel,
        requiresExpiryTracking: input.requiresExpiryTracking,
        defaultRetentionDays: input.defaultRetentionDays,
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });

    await logAuditEvent({
      actorId: currentUser.id,
      action: "USER_ROLE_CHANGE",
      targetType: "CONFIG",
      targetId: docType.id,
      details: {
        actionType: "DOC_TYPE_UPDATE",
        code: docType.code,
        approvalLevel: docType.defaultApprovalLevel,
        retentionDays: docType.defaultRetentionDays,
      },
    });

    revalidatePath("/dashboard/admin/document-types");
    return { success: true };
  } catch (err: unknown) {
    console.error("[UPDATE_DOC_TYPE_ERROR]", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to update document type." };
  }
}

export async function toggleDocumentTypeStatusAction(typeId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { success: false, error: "Unauthorized." };
  }

  if (!isDatabaseConfigured) {
    return { success: true };
  }

  try {
    const docType = await prisma.documentType.update({
      where: { id: typeId },
      data: { isActive },
    });

    await logAuditEvent({
      actorId: currentUser.id,
      action: "USER_ROLE_CHANGE",
      targetType: "CONFIG",
      targetId: docType.id,
      details: { actionType: isActive ? "DOC_TYPE_ACTIVATE" : "DOC_TYPE_DEACTIVATE", code: docType.code, isActive },
    });

    revalidatePath("/dashboard/admin/document-types");
    return { success: true };
  } catch (err: unknown) {
    console.error("[TOGGLE_DOC_TYPE_STATUS_ERROR]", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to update status." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 4. SIGNATORY DELEGATIONS MANAGEMENT CRUD ACTIONS
// ════════════════════════════════════════════════════════════════════════════

export async function assignDelegationAction(params: {
  delegatorId: string;
  delegateId: string;
  unitId: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
}): Promise<{ success: boolean; delegationId?: string; error?: string }> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "DIRECTOR" && currentUser.id !== params.delegatorId)) {
    return { success: false, error: "Unauthorized to assign delegation." };
  }

  if (!isDatabaseConfigured) {
    return { success: true, delegationId: "mock-delegation-id" };
  }

  try {
    const delegation = await prisma.delegateSignatory.create({
      data: {
        delegatorId: params.delegatorId,
        delegateId: params.delegateId,
        unitId: params.unitId,
        startDate: params.startDate,
        endDate: params.endDate,
        reason: params.reason || null,
        isActive: true,
        createdById: currentUser.id,
      },
    });

    await logAuditEvent({
      actorId: currentUser.id,
      unitId: params.unitId,
      action: "DELEGATION_ASSIGNED",
      targetType: "DELEGATION",
      targetId: delegation.id,
      details: {
        delegatorId: params.delegatorId,
        delegateId: params.delegateId,
        startDate: params.startDate,
        endDate: params.endDate,
      },
    });

    revalidatePath("/dashboard/admin/delegations");
    return { success: true, delegationId: delegation.id };
  } catch (error) {
    console.error("[DELEGATION_CREATE_ERROR]", error);
    return { success: false, error: "Failed to assign delegate signatory." };
  }
}

export async function revokeDelegationAction(delegationId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "DIRECTOR")) {
    return { success: false, error: "Unauthorized." };
  }

  if (!isDatabaseConfigured) {
    return { success: true };
  }

  try {
    const delegation = await prisma.delegateSignatory.update({
      where: { id: delegationId },
      data: { isActive: false },
    });

    await logAuditEvent({
      actorId: currentUser.id,
      unitId: delegation.unitId,
      action: "DELEGATION_REVOKED",
      targetType: "DELEGATION",
      targetId: delegation.id,
      details: { reason },
    });

    revalidatePath("/dashboard/admin/delegations");
    return { success: true };
  } catch (error) {
    console.error("[DELEGATION_REVOKE_ERROR]", error);
    return { success: false, error: "Failed to revoke delegation." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 5. DOCUMENT OVERRIDE & COMPLIANCE ARCHIVAL ACTIONS
// ════════════════════════════════════════════════════════════════════════════

export async function adminOverrideDocumentStatusAction(params: {
  documentId: string;
  targetStatus: DocumentStatus;
  approvalLevel?: ApprovalLevel;
  reason: string; // MANDATORY
}): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { success: false, error: "Unauthorized. Admin role required." };
  }

  if (!params.reason || params.reason.trim().length < 5) {
    return { success: false, error: "A detailed reason is required for administrative status override." };
  }

  if (!isDatabaseConfigured) {
    return { success: true };
  }

  try {
    const doc = await prisma.document.findUnique({
      where: { id: params.documentId },
      include: { currentVersion: true, unit: true },
    });

    if (!doc) {
      return { success: false, error: "Document not found." };
    }

    const prevStatus = doc.status;

    await prisma.$transaction(async (tx) => {
      await tx.document.update({
        where: { id: doc.id },
        data: {
          status: params.targetStatus,
          ...(params.approvalLevel ? { approvalLevel: params.approvalLevel } : {}),
          ...(params.targetStatus === DocumentStatus.APPROVED ? { isEscalated: false } : {}),
        },
      });

      if (doc.currentVersion) {
        await tx.approvalAction.create({
          data: {
            documentId: doc.id,
            versionId: doc.currentVersion.id,
            actorId: currentUser.id,
            actorRole: UserRole.ADMIN,
            action: params.targetStatus === DocumentStatus.APPROVED ? ApprovalActionType.DIRECTOR_APPROVE : ApprovalActionType.REJECT_RETURN,
            comments: `[ADMIN OVERRIDE]: Status changed from ${prevStatus} to ${params.targetStatus}. Reason: ${params.reason.trim()}`,
          },
        });
      }
    });

    await logAuditEvent({
      actorId: currentUser.id,
      unitId: doc.unitId,
      action: params.targetStatus === DocumentStatus.APPROVED ? "DOCUMENT_APPROVE_DIRECTOR" : "DOCUMENT_REJECT_RETURN",
      targetType: "DOCUMENT",
      targetId: doc.id,
      documentId: doc.id,
      details: {
        actionType: "ADMIN_STATUS_OVERRIDE",
        trackingNumber: doc.trackingNumber,
        previousStatus: prevStatus,
        newStatus: params.targetStatus,
        reason: params.reason,
      },
    });

    revalidatePath(`/dashboard/documents/${doc.id}`);
    revalidatePath("/dashboard/admin/documents-override");
    revalidatePath("/dashboard/documents");
    return { success: true };
  } catch (error) {
    console.error("[ADMIN_DOC_OVERRIDE_ERROR]", error);
    return { success: false, error: "Failed to override document status." };
  }
}

export async function adminArchiveDocumentAction(params: {
  documentId: string;
  disposalReason: string;
}): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { success: false, error: "Unauthorized. Admin role required." };
  }

  if (!params.disposalReason || params.disposalReason.trim().length < 5) {
    return { success: false, error: "Mandatory: A valid RA 10173 archival/disposal justification is required." };
  }

  if (!isDatabaseConfigured) {
    return { success: true };
  }

  try {
    const doc = await prisma.document.update({
      where: { id: params.documentId },
      data: { status: DocumentStatus.ARCHIVED, isArchived: true, archivedAt: new Date() },
    });

    await logAuditEvent({
      actorId: currentUser.id,
      unitId: doc.unitId,
      action: "DOCUMENT_ARCHIVE",
      targetType: "DOCUMENT",
      targetId: doc.id,
      documentId: doc.id,
      details: {
        trackingNumber: doc.trackingNumber,
        disposalReason: params.disposalReason,
      },
    });

    revalidatePath(`/dashboard/documents/${doc.id}`);
    revalidatePath("/dashboard/admin/documents-override");
    return { success: true };
  } catch (error) {
    console.error("[ADMIN_ARCHIVE_DOC_ERROR]", error);
    return { success: false, error: "Failed to archive document." };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 6. NOTIFICATION QUEUE ACTIONS
// ════════════════════════════════════════════════════════════════════════════

export async function retryNotificationAction(notificationId: string): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { success: false, error: "Unauthorized." };
  }

  if (!isDatabaseConfigured) {
    return { success: true };
  }

  try {
    await prisma.notificationQueue.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.PENDING,
        attempts: 0,
        scheduledFor: new Date(),
      },
    });

    revalidatePath("/dashboard/admin/notifications");
    return { success: true };
  } catch (err: unknown) {
    console.error("[RETRY_NOTIF_ERROR]", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to retry notification." };
  }
}

export async function clearNotificationQueueAction(onlySent: boolean = true): Promise<{ success: boolean; count?: number; error?: string }> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { success: false, error: "Unauthorized." };
  }

  if (!isDatabaseConfigured) {
    return { success: true, count: 0 };
  }

  try {
    const result = await prisma.notificationQueue.deleteMany({
      where: onlySent ? { status: NotificationStatus.SENT } : {},
    });

    revalidatePath("/dashboard/admin/notifications");
    return { success: true, count: result.count };
  } catch (err: unknown) {
    console.error("[CLEAR_NOTIF_QUEUE_ERROR]", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to clear notifications." };
  }
}
