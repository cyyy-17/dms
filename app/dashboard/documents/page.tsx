import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAuthenticatedUser, AuthenticatedUser } from "@/lib/auth/session";
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
  const user: AuthenticatedUser = (await getAuthenticatedUser()) || {
    id: "demo-coordinator-user",
    email: "coordinator.career@firstasia.edu.ph",
    firstName: "Maria",
    lastName: "Santos",
    fullName: "Maria Santos",
    employeeId: "EMP-COORD-001",
    role: "COORDINATOR",
    status: "ACTIVE",
    unitId: "demo-unit-career",
    unitCode: "CAREER",
    unitName: "Career Services & Placement",
    signaturePath: null,
  };

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
