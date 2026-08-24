import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import DocumentRepositoryConsole, { DocumentRow } from "@/components/DocumentRepositoryConsole";
import { DocumentStatus, Prisma } from "@prisma/client";

interface PageProps {
  searchParams: Promise<{
    query?: string;
    unitId?: string;
    status?: string;
    docTypeId?: string;
    escalated?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function DocumentsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  let user = await getAuthenticatedUser();
  if (!user) {
    user = {
      id: "demo-staff-user",
      email: "demo.staff@firstasia.edu.ph",
      firstName: "Maria",
      lastName: "Santos",
      fullName: "Maria Santos",
      role: "COORDINATOR",
      status: "ACTIVE",
      unitId: "demo-unit-career",
      unitCode: "CAREER",
      unitName: "Career Services & Placement",
      signaturePath: null,
    };
  }

  const isDirectorOrAdmin = user.role === "DIRECTOR" || user.role === "ADMIN";

  // Build filter query
  const whereClause: Prisma.DocumentWhereInput = {};

  if (!isDirectorOrAdmin && user.unitId) {
    whereClause.unitId = user.unitId;
  } else if (resolvedParams.unitId) {
    whereClause.unitId = resolvedParams.unitId;
  }

  if (resolvedParams.status && resolvedParams.status !== "ALL") {
    whereClause.status = resolvedParams.status as DocumentStatus;
  }

  if (resolvedParams.docTypeId) {
    whereClause.documentTypeId = resolvedParams.docTypeId;
  }

  if (resolvedParams.escalated === "true") {
    whereClause.isEscalated = true;
  }

  if (resolvedParams.query) {
    whereClause.OR = [
      { trackingNumber: { contains: resolvedParams.query, mode: "insensitive" } },
      { title: { contains: resolvedParams.query, mode: "insensitive" } },
      { description: { contains: resolvedParams.query, mode: "insensitive" } },
    ];
  }

  let documents: DocumentRow[] = [];
  let units: Array<{ id: string; name: string; code: string }> = [];
  let docTypes: Array<{ id: string; name: string; code: string }> = [];

  if (isDatabaseConfigured) {
    try {
      const [fetchedDocs, fetchedUnits, fetchedTypes] = await Promise.all([
        prisma.document.findMany({
          where: whereClause,
          include: {
            documentType: true,
            unit: true,
            uploader: true,
            currentVersion: true,
          },
          orderBy: { updatedAt: "desc" },
        }),
        prisma.unit.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
        prisma.documentType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      ]);
      documents = fetchedDocs;
      units = fetchedUnits;
      docTypes = fetchedTypes;
    } catch {
      documents = [];
    }
  }

  if (documents.length === 0) {
    const fallbackDate = new Date("2026-09-18T00:00:00.000Z");
    documents = [
      {
        id: "sample-doc-1",
        trackingNumber: "SAS-2026-CAR-00001",
        title: "AY 2026-2027 Industry Internship Partner MOU",
        status: DocumentStatus.PENDING_DIRECTOR,
        isEscalated: false,
        rejectionCount: 0,
        createdAt: new Date("2026-08-24T00:00:00.000Z"),
        expiryDate: fallbackDate,
        unit: { code: "CAREER", name: "Career Services & Placement" },
        uploader: { firstName: "Juan", lastName: "Dela Cruz" },
        documentType: { name: "Memorandum of Agreement / Understanding" },
        currentVersion: { versionNumber: 1, fileName: "Industry_MOU_Draft.pdf", fileSize: 1048576 },
      },
      {
        id: "sample-doc-2",
        trackingNumber: "SAS-2026-ALM-00002",
        title: "Grand Alumni Homecoming 2026 Budget & Facility Permit",
        status: DocumentStatus.REJECTED_RETURNED,
        isEscalated: true,
        rejectionCount: 2,
        createdAt: new Date("2026-08-24T00:00:00.000Z"),
        expiryDate: null,
        unit: { code: "ALUMNI", name: "Alumni Relations & Affairs" },
        uploader: { firstName: "Maria", lastName: "Santos" },
        documentType: { name: "Off-Campus / Campus Facility Permit" },
        currentVersion: { versionNumber: 2, fileName: "Homecoming_Permit_v2.pdf", fileSize: 2097152 },
      },
    ];
  }

  return (
    <DocumentRepositoryConsole
      initialDocuments={documents}
      units={units}
      documentTypes={docTypes}
      userRole={user.role}
      isDirectorOrAdmin={isDirectorOrAdmin}
    />
  );
}
