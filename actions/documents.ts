"use server";

import { z } from "zod";
import crypto from "crypto";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit";
import { queueNotification } from "@/lib/notifications";
import { generateTrackingNumber, STORAGE_BUCKETS } from "@/lib/constants";
import { DocumentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface AssignedSignatoryStep {
  userId: string;
  fullName: string;
  role: string;
  title?: string;
  stepOrder: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  signedAt?: string;
}

const SignatoryStepSchema = z.object({
  userId: z.string().uuid("Invalid signatory user ID format"),
  fullName: z.string().min(1, "Signatory full name is required"),
  role: z.string().min(1, "Signatory role is required"),
  title: z.string().optional(),
  stepOrder: z.number().int().nonnegative(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
  signedAt: z.string().optional(),
});

export interface CreateDocumentInput {
  title: string;
  description?: string;
  documentTypeId: string;
  unitId?: string; // Optional if Staff (defaults to own unit)
  effectiveDate?: Date;
  expiryDate?: Date;
  fileBufferBase64: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  sha256Checksum: string;
  signatoryFlow?: AssignedSignatoryStep[];
}

export interface CreateVersionInput {
  documentId: string;
  changeSummary: string;
  fileBufferBase64: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  sha256Checksum: string;
}

/**
 * Ingest a new Document and initial Version (v1)
 */
export async function createDocumentAction(input: CreateDocumentInput): Promise<{
  success: boolean;
  documentId?: string;
  error?: string;
}> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  // If in local preview mode without live Postgres
  if (!isDatabaseConfigured) {
    return { success: true, documentId: "sample-doc-1" };
  }

  // Determine Target Unit (Staff & Coordinator are locked to own unit)
  const targetUnitId =
    currentUser.role === "ADMIN" || currentUser.role === "DIRECTOR"
      ? input.unitId || currentUser.unitId
      : currentUser.unitId;

  if (!targetUnitId) {
    return { success: false, error: "Target unit is required." };
  }

  try {
    const unit = await prisma.unit.findUnique({ where: { id: targetUnitId } });
    if (!unit) {
      return { success: false, error: "Invalid unit specified." };
    }

    const docType = await prisma.documentType.findUnique({
      where: { id: input.documentTypeId },
    });
    if (!docType) {
      return { success: false, error: "Invalid document type specified." };
    }

    // Validate File Size (25MB Max) & MIME Type
    const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
    if (input.fileSize > MAX_FILE_SIZE_BYTES) {
      return { success: false, error: "File exceeds the maximum allowable size of 25MB." };
    }
    if (input.mimeType !== "application/pdf") {
      return { success: false, error: "Only official PDF documents (application/pdf) are permitted." };
    }

    // Server-Side PDF Magic-Bytes Verification
    const buffer = Buffer.from(input.fileBufferBase64, "base64");
    if (buffer.length < 5 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
      return { success: false, error: "Security Exception: Uploaded file does not have valid PDF magic headers." };
    }

    // Server-Side Signatory Flow Validation
    let validatedFlow: AssignedSignatoryStep[] | null = null;
    if (input.signatoryFlow && input.signatoryFlow.length > 0) {
      const flowParse = z.array(SignatoryStepSchema).safeParse(input.signatoryFlow);
      if (!flowParse.success) {
        return {
          success: false,
          error: `Invalid signatory pipeline definition: ${flowParse.error.issues[0]?.message}`,
        };
      }

      // Check all assigned user IDs exist and are active
      const userIds = flowParse.data.map((s) => s.userId);
      const existingUsers = await prisma.user.findMany({
        where: { id: { in: userIds }, status: "ACTIVE" },
        select: { id: true },
      });

      if (existingUsers.length !== userIds.length) {
        return {
          success: false,
          error: "One or more assigned signatories are inactive or not found in the institution registry.",
        };
      }

      validatedFlow = flowParse.data.map((s, idx) => ({
        ...s,
        stepOrder: idx,
        status: "PENDING" as const,
      }));
    }

    // 1. Generate Sequential Tracking Number
    const countInYear = await prisma.document.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), 0, 1),
        },
      },
    });
    const trackingNumber = generateTrackingNumber(unit.code, countInYear + 1);

    // 2. Decode File Buffer and Upload to Supabase Storage
    const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `documents/${unit.code}/${docType.code}/${trackingNumber}/v1_${Date.now()}_${sanitizedFileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.DOCUMENTS)
      .upload(storagePath, buffer, {
        contentType: input.mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("[STORAGE_UPLOAD_ERROR]", uploadError);
      return { success: false, error: "Failed to securely store document binary." };
    }

    // 3. Atomic Database Insertion (Document + DocumentVersion)
    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        const firstSignatoryId = validatedFlow && validatedFlow.length > 0 ? validatedFlow[0].userId : null;

        const doc = await tx.document.create({
          data: {
            trackingNumber,
            title: input.title.trim(),
            description: input.description?.trim() || null,
            documentTypeId: docType.id,
            unitId: unit.id,
            uploaderId: currentUser.id,
            status: DocumentStatus.DRAFT,
            approvalLevel: docType.defaultApprovalLevel,
            effectiveDate: input.effectiveDate || null,
            expiryDate: input.expiryDate || null,
            signatoryFlow: validatedFlow ? JSON.parse(JSON.stringify(validatedFlow)) : undefined,
            currentSignatoryId: firstSignatoryId,
            currentSignatoryIndex: 0,
          },
        });

        const version = await tx.documentVersion.create({
          data: {
            documentId: doc.id,
            versionNumber: 1,
            storagePath,
            fileName: input.fileName,
            fileSize: input.fileSize,
            mimeType: input.mimeType,
            sha256Checksum: input.sha256Checksum,
            changeSummary: "Initial Version (v1) Upload",
            uploadedById: currentUser.id,
          },
        });

        const updatedDoc = await tx.document.update({
          where: { id: doc.id },
          data: { currentVersionId: version.id },
        });

        return updatedDoc;
      });
    } catch (txError) {
      // 4B. Storage Rollback — purge orphaned file if DB transaction failed
      console.error("[DOCUMENT_CREATION_ERROR] DB transaction failed, rolling back storage:", txError);
      await supabaseAdmin.storage.from(STORAGE_BUCKETS.DOCUMENTS).remove([storagePath]);
      return { success: false, error: "Failed to create document record. Storage rolled back." };
    }

    // 4. Log Immutable Audit Event
    await logAuditEvent({
      actorId: currentUser.id,
      unitId: unit.id,
      action: "DOCUMENT_CREATE",
      targetType: "DOCUMENT",
      targetId: result.id,
      documentId: result.id,
      details: {
        trackingNumber: result.trackingNumber,
        title: result.title,
        docTypeCode: docType.code,
        checksum: input.sha256Checksum,
      },
    });

    revalidatePath("/dashboard/documents");
    return { success: true, documentId: result.id };
  } catch (error) {
    console.error("[DOCUMENT_CREATION_ERROR]", error);
    return { success: false, error: "Failed to create document." };
  }
}

/**
 * Upload a New Immutable Version to an Existing Document (e.g. after Rejection / Return)
 */
export async function createDocumentVersionAction(input: CreateVersionInput): Promise<{
  success: boolean;
  versionId?: string;
  error?: string;
}> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  if (!isDatabaseConfigured) {
    return { success: true, versionId: "ver-2" };
  }

  try {
    const doc = await prisma.document.findUnique({
      where: { id: input.documentId },
      include: { unit: true, documentType: true, versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    if (!doc) {
      return { success: false, error: "Document not found." };
    }

    if (doc.uploaderId !== currentUser.id && currentUser.role !== "ADMIN") {
      return { success: false, error: "Only the original uploader or an Admin can upload new versions." };
    }

    // Only editable documents accept new versions
    const editableStatuses = ["DRAFT", "REJECTED_RETURNED"];
    if (!editableStatuses.includes(doc.status)) {
      return { success: false, error: `Cannot upload a new version while the document is in '${doc.status}' status.` };
    }

    // Validate File Size (25MB Max) & MIME Type
    const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
    if (input.fileSize > MAX_FILE_SIZE_BYTES) {
      return { success: false, error: "File exceeds the maximum allowable size of 25MB." };
    }
    if (input.mimeType !== "application/pdf") {
      return { success: false, error: "Only official PDF documents (application/pdf) are permitted." };
    }

    // PDF Magic-Bytes Check
    const buffer = Buffer.from(input.fileBufferBase64, "base64");
    if (buffer.length < 5 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
      return { success: false, error: "Security Exception: Uploaded file does not have valid PDF magic headers." };
    }

    const nextVersionNumber = (doc.versions[0]?.versionNumber || 0) + 1;
    const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `documents/${doc.unit.code}/${doc.documentType.code}/${doc.trackingNumber}/v${nextVersionNumber}_${Date.now()}_${sanitizedFileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.DOCUMENTS)
      .upload(storagePath, buffer, {
        contentType: input.mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("[STORAGE_UPLOAD_ERROR]", uploadError);
      return { success: false, error: "Failed to securely store new version binary." };
    }

    const newVersion = await prisma.$transaction(async (tx) => {
      const ver = await tx.documentVersion.create({
        data: {
          documentId: doc.id,
          versionNumber: nextVersionNumber,
          storagePath,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          sha256Checksum: input.sha256Checksum,
          changeSummary: input.changeSummary.trim(),
          uploadedById: currentUser.id,
        },
      });

      await tx.document.update({
        where: { id: doc.id },
        data: {
          currentVersionId: ver.id,
        },
      });

      return ver;
    });

    await logAuditEvent({
      actorId: currentUser.id,
      unitId: doc.unitId,
      action: "DOCUMENT_VERSION_UPLOAD",
      targetType: "VERSION",
      targetId: newVersion.id,
      documentId: doc.id,
      details: {
        versionNumber: nextVersionNumber,
        checksum: input.sha256Checksum,
        changeSummary: input.changeSummary,
      },
    });

    revalidatePath(`/dashboard/documents/${doc.id}`);
    return { success: true, versionId: newVersion.id };
  } catch (error) {
    console.error("[VERSION_CREATION_ERROR]", error);
    return { success: false, error: "Failed to record document version." };
  }
}

/**
 * Submit / Resubmit Document for Sequential Review
 */
export async function submitDocumentForReviewAction(documentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized." };
  }

  if (!isDatabaseConfigured) {
    return { success: true };
  }

  try {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: { currentVersion: true, unit: true, uploader: true },
    });

    if (!doc || !doc.currentVersion) {
      return { success: false, error: "Document or active version not found." };
    }

    if (doc.status !== DocumentStatus.DRAFT && doc.status !== DocumentStatus.REJECTED_RETURNED) {
      return { success: false, error: "Document is already in review or finalized." };
    }

    const rawFlow = Array.isArray(doc.signatoryFlow)
      ? (doc.signatoryFlow as unknown as AssignedSignatoryStep[])
      : [];

    // Reset flow statuses to PENDING for a fresh sequential review cycle
    const resetFlow = rawFlow.map((step, idx) => ({
      ...step,
      stepOrder: idx,
      status: "PENDING" as const,
      signedAt: undefined,
    }));

    const firstSigner = resetFlow[0] || null;
    const targetSignerId = firstSigner ? firstSigner.userId : null;

    await prisma.$transaction(async (tx) => {
      await tx.document.update({
        where: { id: doc.id },
        data: {
          status: DocumentStatus.PENDING_COORDINATOR,
          signatoryFlow: resetFlow.length > 0 ? JSON.parse(JSON.stringify(resetFlow)) : undefined,
          currentSignatoryId: targetSignerId,
          currentSignatoryIndex: 0,
        },
      });

      await tx.approvalAction.create({
        data: {
          documentId: doc.id,
          versionId: doc.currentVersion!.id,
          actorId: currentUser.id,
          actorRole: currentUser.role,
          action: "SUBMIT",
          comments: firstSigner
            ? `Submitted for sequential review starting with ${firstSigner.fullName} (${firstSigner.role})`
            : "Submitted for sequential unit review",
        },
      });
    });

    // Notify first signatory or unit coordinators
    if (targetSignerId) {
      const assignedUser = await prisma.user.findUnique({ where: { id: targetSignerId } });
      if (assignedUser) {
        await queueNotification({
          recipientId: assignedUser.id,
          recipientEmail: assignedUser.email,
          type: "DOCUMENT_SUBMITTED_COORDINATOR",
          subject: `SASDMS: Document Awaiting Your Signature (Step 1 of ${resetFlow.length}) - ${doc.trackingNumber}`,
          templateName: "coordinator-review-alert",
          payload: {
            trackingNumber: doc.trackingNumber,
            title: doc.title,
            uploaderName: `${doc.uploader.firstName} ${doc.uploader.lastName}`,
            documentId: doc.id,
            stepOrder: 1,
            totalSteps: resetFlow.length,
          },
        });
      }
    } else {
      const coordinators = await prisma.user.findMany({
        where: { unitId: doc.unitId, role: "COORDINATOR", status: "ACTIVE" },
      });

      for (const coord of coordinators) {
        await queueNotification({
          recipientId: coord.id,
          recipientEmail: coord.email,
          type: "DOCUMENT_SUBMITTED_COORDINATOR",
          subject: `SASDMS: Document Awaiting Review - ${doc.trackingNumber}`,
          templateName: "coordinator-review-alert",
          payload: {
            trackingNumber: doc.trackingNumber,
            title: doc.title,
            uploaderName: `${doc.uploader.firstName} ${doc.uploader.lastName}`,
            documentId: doc.id,
          },
        });
      }
    }

    await logAuditEvent({
      actorId: currentUser.id,
      unitId: doc.unitId,
      action: "DOCUMENT_SUBMIT",
      targetType: "DOCUMENT",
      targetId: doc.id,
      documentId: doc.id,
      details: { trackingNumber: doc.trackingNumber, totalSignatories: resetFlow.length },
    });

    revalidatePath(`/dashboard/documents/${doc.id}`);
    revalidatePath("/dashboard/documents");
    revalidatePath("/dashboard/approvals");
    return { success: true };
  } catch (error) {
    console.error("[SUBMIT_DOCUMENT_ERROR]", error);
    return { success: false, error: "Failed to submit document." };
  }
}

/**
 * Uploader Action: Recall / Withdraw a document back to DRAFT
 * Permitted only if no approvals or rejections have taken place yet.
 */
export async function withdrawDocumentAction(documentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized." };
  }

  if (!isDatabaseConfigured) {
    return { success: true };
  }

  try {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: { currentVersion: true, approvalActions: true },
    });

    if (!doc) {
      return { success: false, error: "Document not found." };
    }

    if (doc.uploaderId !== currentUser.id && currentUser.role !== "ADMIN") {
      return { success: false, error: "Only the uploader or an Admin can withdraw a submitted document." };
    }

    if (doc.status !== DocumentStatus.PENDING_COORDINATOR && doc.status !== DocumentStatus.PENDING_DIRECTOR) {
      return { success: false, error: "Only documents currently pending initial review can be recalled." };
    }

    // Verify no signatory approval has taken place
    const approvalCount = doc.approvalActions.filter(
      (a) => a.action === "COORDINATOR_APPROVE" || a.action === "DIRECTOR_APPROVE"
    ).length;

    if (approvalCount > 0) {
      return { success: false, error: "Cannot withdraw: One or more signatories have already recorded formal sign-offs." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.document.update({
        where: { id: doc.id },
        data: {
          status: DocumentStatus.DRAFT,
          currentSignatoryId: null,
        },
      });

      if (doc.currentVersion) {
        await tx.approvalAction.create({
          data: {
            documentId: doc.id,
            versionId: doc.currentVersion.id,
            actorId: currentUser.id,
            actorRole: currentUser.role,
            action: "REJECT_RETURN",
            comments: "Document recalled/withdrawn by uploader for editing.",
          },
        });
      }
    });

    await logAuditEvent({
      actorId: currentUser.id,
      unitId: doc.unitId,
      action: "DOCUMENT_REJECT_RETURN",
      targetType: "DOCUMENT",
      targetId: doc.id,
      documentId: doc.id,
      details: { actionType: "WITHDRAWAL_BY_UPLOADER", trackingNumber: doc.trackingNumber },
    });

    revalidatePath(`/dashboard/documents/${doc.id}`);
    revalidatePath("/dashboard/documents");
    revalidatePath("/dashboard/approvals");
    return { success: true };
  } catch (error) {
    console.error("[WITHDRAW_DOCUMENT_ERROR]", error);
    return { success: false, error: "Failed to withdraw document." };
  }
}

/**
 * Verify SHA-256 Checksum Integrity for Non-Repudiation
 */
export async function verifyDocumentChecksumAction(
  documentId: string,
  versionId?: string
): Promise<{
  success: boolean;
  isValid?: boolean;
  storedChecksum?: string;
  calculatedChecksum?: string;
  error?: string;
}> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized." };
  }

  if (!isDatabaseConfigured) {
    return { success: true, isValid: true, storedChecksum: "mock-hash", calculatedChecksum: "mock-hash" };
  }

  try {
    const version = versionId
      ? await prisma.documentVersion.findUnique({ where: { id: versionId } })
      : await prisma.documentVersion.findFirst({
          where: { documentId },
          orderBy: { versionNumber: "desc" },
        });

    if (!version) {
      return { success: false, error: "Document version record not found." };
    }

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.DOCUMENTS)
      .download(version.storagePath);

    if (downloadError || !fileData) {
      return { success: false, error: "Unable to retrieve storage binary for checksum calculation." };
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const hash = crypto.createHash("sha256").update(Buffer.from(arrayBuffer)).digest("hex");
    const isValid = hash.toLowerCase() === version.sha256Checksum.toLowerCase();

    return {
      success: true,
      isValid,
      storedChecksum: version.sha256Checksum,
      calculatedChecksum: hash,
    };
  } catch (error) {
    console.error("[VERIFY_CHECKSUM_ERROR]", error);
    return { success: false, error: "Failed to compute checksum." };
  }
}

/**
 * Generate Secure Short-Lived Signed Download/View URL (15 mins)
 * Validates requester role, tenancy boundaries, and logs RA 10173 audit trail.
 */
export async function getSignedDocumentUrlAction(
  storagePath: string,
  documentId?: string,
  actionType: "VIEW" | "DOWNLOAD" = "VIEW"
): Promise<{
  success: boolean;
  signedUrl?: string;
  error?: string;
}> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  if (!isDatabaseConfigured) {
    return {
      success: true,
      signedUrl: "data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1IDAgUiAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeAErVAhUKC5JLCktSgUAFwIFDAplbmRzdHJlYW0KZW5kb2JqCg==",
    };
  }

  try {
    // Strict Tenancy & Authorization Verification
    if (currentUser.role !== "ADMIN" && currentUser.role !== "DIRECTOR") {
      let targetDoc = null;
      if (documentId) {
        targetDoc = await prisma.document.findUnique({
          where: { id: documentId },
          select: { unitId: true, uploaderId: true, currentSignatoryId: true },
        });
      } else {
        const version = await prisma.documentVersion.findFirst({
          where: { storagePath },
          include: { document: { select: { unitId: true, uploaderId: true, currentSignatoryId: true } } },
        });
        targetDoc = version?.document || null;
      }

      if (targetDoc) {
        const isAuthorized =
          targetDoc.unitId === currentUser.unitId ||
          targetDoc.uploaderId === currentUser.id ||
          targetDoc.currentSignatoryId === currentUser.id;

        if (!isAuthorized) {
          return { success: false, error: "Access denied. Cross-unit document download is strictly restricted." };
        }
      }
    }

    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.DOCUMENTS)
      .createSignedUrl(storagePath, 900); // 15 minutes (900 seconds)

    if (error || !data?.signedUrl) {
      return { success: false, error: "Unable to generate secure signed link." };
    }

    // Record immutable audit event (RA 10173 non-repudiation)
    await logAuditEvent({
      actorId: currentUser.id,
      unitId: currentUser.unitId,
      action: actionType === "DOWNLOAD" ? "DOCUMENT_DOWNLOAD" : "DOCUMENT_VIEW",
      targetType: "DOCUMENT",
      targetId: documentId,
      documentId: documentId,
      details: { storagePath, accessType: actionType },
    });

    return { success: true, signedUrl: data.signedUrl };
  } catch (error) {
    console.error("[SIGNED_URL_ERROR]", error);
    return { success: false, error: "Storage signing error." };
  }
}

/**
 * Asynchronously searches documents and units for the quick command palette.
 * Scoped strictly to the user's RBAC permissions and unit tenancy.
 */
export async function quickSearchLiveAction(query: string): Promise<{
  success: boolean;
  documents: Array<{
    id: string;
    trackingNumber: string;
    title: string;
    status: DocumentStatus;
    unitCode: string;
    documentTypeName: string;
    uploaderName: string;
  }>;
  units: Array<{
    id: string;
    code: string;
    name: string;
  }>;
  error?: string;
}> {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return { success: false, documents: [], units: [], error: "Unauthenticated." };
    }

    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      return { success: true, documents: [], units: [] };
    }

    if (!isDatabaseConfigured) {
      return { success: true, documents: [], units: [] };
    }

    const isDirectorOrAdmin = currentUser.role === "DIRECTOR" || currentUser.role === "ADMIN";

    // Build permission-aware WHERE clause
    const docWhereClause: Prisma.DocumentWhereInput = {
      OR: [
        { trackingNumber: { contains: trimmed, mode: "insensitive" } },
        { title: { contains: trimmed, mode: "insensitive" } },
      ],
    };

    if (!isDirectorOrAdmin && currentUser.unitId) {
      docWhereClause.AND = [
        {
          OR: [
            { unitId: currentUser.unitId },
            { uploaderId: currentUser.id },
            { currentSignatoryId: currentUser.id },
          ],
        },
      ];
    }

    const [matchingDocs, matchingUnits] = await Promise.all([
      prisma.document.findMany({
        where: docWhereClause,
        take: 6,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          trackingNumber: true,
          title: true,
          status: true,
          unit: { select: { code: true } },
          documentType: { select: { name: true } },
          uploader: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.unit.findMany({
        where: {
          isActive: true,
          OR: [
            { code: { contains: trimmed, mode: "insensitive" } },
            { name: { contains: trimmed, mode: "insensitive" } },
          ],
        },
        take: 4,
        orderBy: { code: "asc" },
        select: { id: true, code: true, name: true },
      }),
    ]);

    return {
      success: true,
      documents: matchingDocs.map((d) => ({
        id: d.id,
        trackingNumber: d.trackingNumber,
        title: d.title,
        status: d.status,
        unitCode: d.unit?.code || "UNASSIGNED",
        documentTypeName: d.documentType?.name || "Document",
        uploaderName: d.uploader ? `${d.uploader.firstName} ${d.uploader.lastName}` : "Unknown",
      })),
      units: matchingUnits,
    };
  } catch (error) {
    console.error("[QUICK_SEARCH_ERROR]", error);
    return { success: false, documents: [], units: [], error: "Search failed." };
  }
}

