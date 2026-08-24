import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { DocumentStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron execution." }, { status: 401 });
  }

  // Scan for ARCHIVED or REJECTED_CLOSED documents that have exceeded their retention period
  const allTerminatedDocs = await prisma.document.findMany({
    where: {
      status: {
        in: [DocumentStatus.ARCHIVED, DocumentStatus.REJECTED_CLOSED],
      },
    },
    include: {
      documentType: true,
    },
  });

  const now = new Date();
  const flagCandidates = [];

  for (const doc of allTerminatedDocs) {
    const retentionDays = doc.documentType.defaultRetentionDays || 1825;
    const documentAgeDays = Math.floor(
      (now.getTime() - new Date(doc.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (documentAgeDays >= retentionDays) {
      flagCandidates.push({
        id: doc.id,
        trackingNumber: doc.trackingNumber,
        title: doc.title,
        status: doc.status,
        ageDays: documentAgeDays,
        retentionDays,
      });
    }
  }

  // Note: To prevent catastrophic accidental data loss under RA 10173,
  // candidates are flagged for Admin review before hard purge execution.
  if (flagCandidates.length > 0) {
    await logAuditEvent({
      action: "DOCUMENT_PURGE",
      targetType: "DOCUMENT",
      details: {
        message: "Retention policy check identified candidate records for disposal",
        candidateCount: flagCandidates.length,
        candidateIds: flagCandidates.map((c) => c.id),
      },
    });
  }

  return NextResponse.json({
    success: true,
    flaggedForDisposalCount: flagCandidates.length,
    candidates: flagCandidates,
  });
}
