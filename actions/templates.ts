"use server";

import { isDatabaseConfigured } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";

/**
 * Upload an official blank PDF template for a document type.
 */
export async function uploadDocTypeTemplateAction(
  docTypeCode: string,
  base64DataUrl: string,
  fileName: string
): Promise<{
  success: boolean;
  storagePath?: string;
  error?: string;
}> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  try {
    const cleanCode = docTypeCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    const base64Data = base64DataUrl.replace(/^data:application\/pdf;base64,/, "").replace(/^data:application\/octet-stream;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const storagePath = `templates/${cleanCode}_template.pdf`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.DOCUMENTS)
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("[TEMPLATE_UPLOAD_ERROR]", uploadError);
      return { success: false, error: uploadError.message };
    }

    if (isDatabaseConfigured) {
      await logAuditEvent({
        actorId: currentUser.id,
        unitId: currentUser.unitId,
        action: "DOCUMENT_CREATE",
        targetType: "CONFIG",
        targetId: docTypeCode,
        details: {
          actionType: "TEMPLATE_UPLOADED",
          docTypeCode,
          storagePath,
          fileName,
          byteLength: buffer.length,
        },
      });
    }

    revalidatePath("/dashboard/admin/document-types");
    revalidatePath("/dashboard/documents/new");
    return { success: true, storagePath };
  } catch (error) {
    console.error("[TEMPLATE_UPLOAD_ERROR]", error);
    return { success: false, error: "Failed to upload document template." };
  }
}

/**
 * Generate a short-lived download URL for an official document type template.
 */
export async function getDocTypeTemplateDownloadUrlAction(docTypeCode: string): Promise<{
  success: boolean;
  downloadUrl?: string;
  hasTemplate?: boolean;
  error?: string;
}> {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return { success: false, error: "Unauthorized." };
  }

  try {
    const cleanCode = docTypeCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    const storagePath = `templates/${cleanCode}_template.pdf`;

    // Generate signed URL (valid for 1 hour)
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.DOCUMENTS)
      .createSignedUrl(storagePath, 3600);

    if (error || !data?.signedUrl) {
      return { success: true, hasTemplate: false };
    }

    return {
      success: true,
      hasTemplate: true,
      downloadUrl: data.signedUrl,
    };
  } catch (error) {
    console.error("[TEMPLATE_GET_ERROR]", error);
    return { success: false, hasTemplate: false, error: "Error retrieving template." };
  }
}
