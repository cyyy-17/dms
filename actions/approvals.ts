"use server";

import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAuthenticatedUser, checkActiveDelegation } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";
import { queueNotification } from "@/lib/notifications";
import { AUTO_ESCALATION_REJECTION_THRESHOLD, STORAGE_BUCKETS } from "@/lib/constants";
import { applyElectronicSignatureToStorageDocument, detectSignatoryCoordinatesInPdf } from "@/lib/pdf/stamper";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DocumentStatus, ApprovalActionType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface ApprovalInput {
  documentId: string;
  comments?: string;
  signatureApplied?: boolean;
  escalateToDirectorOverride?: boolean;
  customCoordinates?: { page: number; x: number; y: number } | null;
}

export interface RejectionInput {
  documentId: string;
  comments: string; // MANDATORY
}

import { AssignedSignatoryStep } from "@/actions/documents";

/**
 * Universal Assigned Signatory Approval Action
 * Handles step-by-step turn-based signatory flow and Smart Anchor / Visual Placement e-signature stamping
 */
export async function assignedSignatoryApproveAction(input: ApprovalInput): Promise<{
  success: boolean;
  error?: string;
}> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  if (!isDatabaseConfigured) {
    return { success: true };
  }

  try {
    const doc = await prisma.document.findUnique({
      where: { id: input.documentId },
      include: { currentVersion: true, uploader: true, unit: true },
    });

    if (!doc || !doc.currentVersion) {
      return { success: false, error: "Document or version not found." };
    }

    const flow = Array.isArray(doc.signatoryFlow)
      ? (doc.signatoryFlow as unknown as AssignedSignatoryStep[])
      : [];

    const isAssigned = doc.currentSignatoryId === currentUser.id;
    const isDelegate = await checkActiveDelegation(currentUser.id, doc.unitId);
    const isAuthorized =
      currentUser.role === "ADMIN" ||
      isAssigned ||
      (flow.length === 0 && (currentUser.role === "COORDINATOR" || currentUser.role === "DIRECTOR")) ||
      isDelegate;

    if (!isAuthorized) {
      return { success: false, error: "You are not the currently assigned signatory for this document." };
    }

    const currentIndex = doc.currentSignatoryIndex || 0;
    const nextIndex = currentIndex + 1;
    const isFinalStep = flow.length === 0 ? true : nextIndex >= flow.length;
    const nextSigner = !isFinalStep && flow[nextIndex] ? flow[nextIndex] : null;

    // Update flow array
    const updatedFlow = flow.map((step, idx) => {
      if (idx === currentIndex) {
        return {
          ...step,
          status: "APPROVED" as const,
          signedAt: new Date().toISOString(),
        };
      }
      return step;
    });

    const nextStatus = isFinalStep
      ? DocumentStatus.APPROVED
      : DocumentStatus.PENDING_COORDINATOR;

    await prisma.$transaction(async (tx) => {
      await tx.document.update({
        where: { id: doc.id },
        data: {
          status: nextStatus,
          signatoryFlow: updatedFlow.length > 0 ? JSON.parse(JSON.stringify(updatedFlow)) : undefined,
          currentSignatoryIndex: isFinalStep ? currentIndex : nextIndex,
          currentSignatoryId: isFinalStep ? null : nextSigner?.userId || null,
        },
      });

      await tx.approvalAction.create({
        data: {
          documentId: doc.id,
          versionId: doc.currentVersion!.id,
          actorId: currentUser.id,
          actorRole: currentUser.role,
          action: isFinalStep ? ApprovalActionType.DIRECTOR_APPROVE : ApprovalActionType.COORDINATOR_APPROVE,
          comments: input.comments?.trim() || `Approved by ${currentUser.fullName} (${currentUser.role || "Signatory"})`,
          signatureApplied: !!input.signatureApplied,
          signaturePath: input.signatureApplied ? currentUser.signaturePath : null,
        },
      });
    });

    // 4A: Queue notifications AFTER transaction commit — prevents orphaned notification rows on rollback
    if (nextSigner) {
      const nextUser = await prisma.user.findUnique({ where: { id: nextSigner.userId } });
      if (nextUser) {
        await queueNotification({
          recipientId: nextUser.id,
          recipientEmail: nextUser.email,
          type: "DOCUMENT_SUBMITTED_COORDINATOR",
          subject: `SASDMS: Document Awaiting Your Signature (Step ${nextIndex + 1} of ${flow.length}) - ${doc.trackingNumber}`,
          templateName: "coordinator-review-alert",
          payload: {
            trackingNumber: doc.trackingNumber,
            title: doc.title,
            uploaderName: `${doc.uploader.firstName} ${doc.uploader.lastName}`,
            documentId: doc.id,
            stepOrder: nextIndex + 1,
            totalSteps: flow.length,
          },
        });
      }
    } else {
      await queueNotification({
        recipientId: doc.uploaderId,
        recipientEmail: doc.uploader.email,
        type: "DOCUMENT_APPROVED_ALL",
        subject: `SASDMS: Document Fully Approved & Sealed - ${doc.trackingNumber}`,
        templateName: "document-approved",
        payload: {
          documentId: doc.id,
          trackingNumber: doc.trackingNumber,
          title: doc.title,
          requestorName: `${doc.uploader.firstName} ${doc.uploader.lastName}`,
          unitName: doc.unit.name,
          totalSignatories: flow.length > 0 ? flow.length : 1,
        },
      });
    }

    // Apply Non-Overlapping Smart / Custom PDF Electronic Signature Stamp
    if (input.signatureApplied && doc.currentVersion?.storagePath) {
      try {
        const stampRes = await applyElectronicSignatureToStorageDocument({
          storagePath: doc.currentVersion.storagePath,
          signatureStoragePath: currentUser.signaturePath,
          signerName: currentUser.fullName,
          signerRole: currentUser.role,
          unitName: doc.unit.name,
          actionTitle: `${currentUser.fullName} Sign-Off`,
          slotIndex: currentIndex,
          customCoordinates: input.customCoordinates || null,
        });

        if (stampRes.success && stampRes.newChecksum) {
          await prisma.documentVersion.update({
            where: { id: doc.currentVersion.id },
            data: { sha256Checksum: stampRes.newChecksum },
          });
        }
      } catch (stampErr) {
        console.warn("[PDF_STAMP_WARNING]", stampErr);
      }
    }

    await logAuditEvent({
      actorId: currentUser.id,
      unitId: doc.unitId,
      action: currentUser.role === "DIRECTOR" ? "DOCUMENT_APPROVE_DIRECTOR" : "DOCUMENT_APPROVE_COORDINATOR",
      targetType: "DOCUMENT",
      targetId: doc.id,
      documentId: doc.id,
      details: {
        nextStatus,
        comments: input.comments,
        signatureApplied: input.signatureApplied,
        stepIndex: currentIndex,
        customCoordinates: input.customCoordinates || null,
      },
    });

    revalidatePath(`/dashboard/documents/${doc.id}`);
    revalidatePath("/dashboard/approvals");
    revalidatePath("/dashboard/documents");
    return { success: true };
  } catch (error) {
    console.error("[ASSIGNED_SIGNATORY_APPROVE_ERROR]", error);
    return { success: false, error: "Failed to process approval." };
  }
}

/**
 * Server Action: Detects the Smart Anchor Placement Coordinates for the active document and signatory
 */
export async function detectSignatoryPlacementAction(documentId: string): Promise<{
  success: boolean;
  coordinates?: {
    pageIndex: number;
    x: number;
    y: number;
    matchedText: string;
    totalPages: number;
    pageWidth: number;
    pageHeight: number;
  };
  error?: string;
}> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  try {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: { currentVersion: true, unit: true },
    });

    if (!doc || !doc.currentVersion?.storagePath) {
      return { success: false, error: "Document or version file not found." };
    }

    const { data: fileData, error: fileError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.DOCUMENTS)
      .download(doc.currentVersion.storagePath);

    if (fileError || !fileData) {
      return { success: false, error: "Could not download document file for analysis." };
    }

    const pdfBuffer = Buffer.from(await fileData.arrayBuffer());
    const currentIndex = doc.currentSignatoryIndex || 0;

    const detected = await detectSignatoryCoordinatesInPdf(pdfBuffer, {
      signerName: currentUser.fullName,
      signerRole: currentUser.role,
      slotIndex: currentIndex,
      unitName: doc.unit.name,
    });

    if (detected) {
      return { success: true, coordinates: detected };
    }

    return {
      success: true,
      coordinates: {
        pageIndex: 0,
        x: 35,
        y: 40,
        matchedText: "fallback",
        totalPages: 1,
        pageWidth: 612,
        pageHeight: 792,
      },
    };
  } catch (err: unknown) {
    console.error("[DETECT_PLACEMENT_ACTION_ERROR]", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to analyze document placement.",
    };
  }
}

/**
 * Coordinator Approval Action (Wraps assignedSignatoryApproveAction)
 */
export async function coordinatorApproveAction(input: ApprovalInput): Promise<{
  success: boolean;
  error?: string;
}> {
  return assignedSignatoryApproveAction(input);
}

/**
 * Director Final Approval Action (Wraps assignedSignatoryApproveAction)
 */
export async function directorApproveAction(input: ApprovalInput): Promise<{
  success: boolean;
  error?: string;
}> {
  return assignedSignatoryApproveAction(input);
}

/**
 * Rejection and Return to Staff with Mandatory Feedback Comments & Auto-Escalation
 */
export async function rejectReturnAction(input: RejectionInput): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!input.comments || input.comments.trim().length < 5) {
    return { success: false, error: "Mandatory: A detailed explanation for the rejection is required." };
  }

  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  if (!isDatabaseConfigured) {
    return { success: true };
  }

  try {
    const doc = await prisma.document.findUnique({
      where: { id: input.documentId },
      include: { currentVersion: true, uploader: true, unit: true },
    });

    if (!doc || !doc.currentVersion) {
      return { success: false, error: "Document not found." };
    }

    const newRejectionCount = doc.rejectionCount + 1;
    const isEscalatedNow = newRejectionCount >= AUTO_ESCALATION_REJECTION_THRESHOLD;

    await prisma.$transaction(async (tx) => {
      await tx.document.update({
        where: { id: doc.id },
        data: {
          status: DocumentStatus.REJECTED_RETURNED,
          rejectionCount: newRejectionCount,
          isEscalated: isEscalatedNow ? true : doc.isEscalated,
          currentSignatoryId: null,
          currentSignatoryIndex: 0,
        },
      });

      await tx.approvalAction.create({
        data: {
          documentId: doc.id,
          versionId: doc.currentVersion!.id,
          actorId: currentUser.id,
          actorRole: currentUser.role,
          action: ApprovalActionType.REJECT_RETURN,
          comments: input.comments.trim(),
          isEscalatedFlag: isEscalatedNow,
        },
      });

      await queueNotification({
        recipientId: doc.uploaderId,
        recipientEmail: doc.uploader.email,
        type: "DOCUMENT_RETURNED_STAFF",
        subject: `SASDMS: Document Returned for Revision - ${doc.trackingNumber}`,
        templateName: "document-returned",
        payload: {
          documentId: doc.id,
          trackingNumber: doc.trackingNumber,
          title: doc.title,
          comments: input.comments.trim(),
          rejectionCount: newRejectionCount,
          isEscalated: isEscalatedNow,
        },
      });

      if (isEscalatedNow) {
        const directors = await tx.user.findMany({
          where: { role: "DIRECTOR", status: "ACTIVE" },
        });
        for (const dir of directors) {
          await queueNotification({
            recipientId: dir.id,
            recipientEmail: dir.email,
            type: "DOCUMENT_ESCALATED_DIRECTOR",
            subject: `SASDMS: Auto-Escalation Alert (2x Rejection) - ${doc.trackingNumber}`,
            templateName: "director-escalation-alert",
            payload: {
              documentId: doc.id,
              trackingNumber: doc.trackingNumber,
              title: doc.title,
              rejectionCount: newRejectionCount,
              unitName: doc.unit.name,
            },
          });
        }
      }
    });

    await logAuditEvent({
      actorId: currentUser.id,
      unitId: doc.unitId,
      action: "DOCUMENT_REJECT_RETURN",
      targetType: "DOCUMENT",
      targetId: doc.id,
      documentId: doc.id,
      details: {
        comments: input.comments,
        rejectionCount: newRejectionCount,
        isEscalated: isEscalatedNow,
      },
    });

    revalidatePath(`/dashboard/documents/${doc.id}`);
    revalidatePath("/dashboard/approvals");
    return { success: true };
  } catch (error) {
    console.error("[REJECT_RETURN_ERROR]", error);
    return { success: false, error: "Failed to return document." };
  }
}

/**
 * Terminal Reject & Close Action for Dead-Ends (Wrong unit, duplicate, canceled)
 */
export async function rejectCloseAction(input: RejectionInput): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!input.comments || input.comments.trim().length < 5) {
    return { success: false, error: "Mandatory: A detailed closing reason is required." };
  }

  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  if (!isDatabaseConfigured) {
    return { success: true };
  }

  try {
    const doc = await prisma.document.findUnique({
      where: { id: input.documentId },
      include: { currentVersion: true, uploader: true },
    });

    if (!doc || !doc.currentVersion) {
      return { success: false, error: "Document not found." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.document.update({
        where: { id: doc.id },
        data: { status: DocumentStatus.REJECTED_CLOSED },
      });

      await tx.approvalAction.create({
        data: {
          documentId: doc.id,
          versionId: doc.currentVersion!.id,
          actorId: currentUser.id,
          actorRole: currentUser.role,
          action: ApprovalActionType.REJECT_CLOSE,
          comments: input.comments.trim(),
        },
      });

      await queueNotification({
        recipientId: doc.uploaderId,
        recipientEmail: doc.uploader.email,
        type: "DOCUMENT_CLOSED",
        subject: `SASDMS: Document Terminated & Closed - ${doc.trackingNumber}`,
        templateName: "document-closed",
        payload: {
          documentId: doc.id,
          trackingNumber: doc.trackingNumber,
          title: doc.title,
          comments: input.comments.trim(),
        },
      });
    });

    await logAuditEvent({
      actorId: currentUser.id,
      unitId: doc.unitId,
      action: "DOCUMENT_REJECT_CLOSE",
      targetType: "DOCUMENT",
      targetId: doc.id,
      documentId: doc.id,
      details: { comments: input.comments },
    });

    revalidatePath(`/dashboard/documents/${doc.id}`);
    revalidatePath("/dashboard/approvals");
    return { success: true };
  } catch (error) {
    console.error("[REJECT_CLOSE_ERROR]", error);
    return { success: false, error: "Failed to terminate document." };
  }
}
