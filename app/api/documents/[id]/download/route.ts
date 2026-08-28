import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { applyDownloadWatermark } from "@/lib/pdf/watermark";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        currentVersion: true,
        unit: true,
      },
    });

    if (!doc || !doc.currentVersion) {
      return NextResponse.json({ error: "Document or version not found" }, { status: 404 });
    }

    // Access control
    const isAuthorized =
      currentUser.role === "ADMIN" ||
      currentUser.role === "DIRECTOR" ||
      doc.unitId === currentUser.unitId ||
      doc.uploaderId === currentUser.id ||
      doc.currentSignatoryId === currentUser.id;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Access denied. Cross-unit document download is restricted." },
        { status: 403 }
      );
    }

    // Download binary from Supabase Storage
    const { data: blobData, error: downloadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.DOCUMENTS)
      .download(doc.currentVersion.storagePath);

    if (downloadError || !blobData) {
      return NextResponse.json(
        { error: "Failed to retrieve binary file from storage." },
        { status: 500 }
      );
    }

    const arrayBuffer = await blobData.arrayBuffer();
    const isPdf =
      doc.currentVersion.mimeType.includes("pdf") ||
      doc.currentVersion.fileName.toLowerCase().endsWith(".pdf");

    let finalBuffer: Uint8Array;

    if (isPdf) {
      finalBuffer = await applyDownloadWatermark(arrayBuffer, {
        userName: currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`,
        userRole: currentUser.role,
        trackingNumber: doc.trackingNumber,
      });
    } else {
      finalBuffer = new Uint8Array(arrayBuffer);
    }

    // Record audit event
    await logAuditEvent({
      actorId: currentUser.id,
      unitId: doc.unitId,
      action: "DOCUMENT_DOWNLOAD",
      targetType: "DOCUMENT",
      targetId: doc.id,
      documentId: doc.id,
      details: {
        trackingNumber: doc.trackingNumber,
        versionNumber: doc.currentVersion.versionNumber,
        fileName: doc.currentVersion.fileName,
        watermarked: isPdf,
      },
    });

    const safeFilename = encodeURIComponent(doc.currentVersion.fileName);

    return new NextResponse(Buffer.from(finalBuffer), {
      status: 200,
      headers: {
        "Content-Type": isPdf ? "application/pdf" : doc.currentVersion.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${doc.currentVersion.fileName}"; filename*=UTF-8''${safeFilename}`,
        "Content-Length": finalBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("[DOCUMENT_DOWNLOAD_ROUTE_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error downloading document." },
      { status: 500 }
    );
  }
}
