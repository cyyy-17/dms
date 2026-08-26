import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAuthenticatedUser, AuthenticatedUser } from "@/lib/auth/session";
import DocumentUploadForm from "@/components/DocumentUploadForm";

interface DocTypeOption {
  id: string;
  code: string;
  name: string;
  requiresExpiryTracking: boolean;
  defaultApprovalLevel: string;
}

interface UnitOption {
  id: string;
  code: string;
  name: string;
}

export const dynamic = "force-dynamic";

export default async function NewDocumentPage() {
  const user: AuthenticatedUser = (await getAuthenticatedUser()) || {
    id: "demo-staff-user",
    email: "demo.staff@firstasia.edu.ph",
    firstName: "Maria",
    lastName: "Santos",
    fullName: "Maria Santos",
    employeeId: "EMP-2026-042",
    role: "COORDINATOR",
    status: "ACTIVE",
    unitId: "demo-unit-career",
    unitCode: "CAREER",
    unitName: "Career Services & Placement",
    signaturePath: null,
  };

  let docTypes: DocTypeOption[] = [];
  let units: UnitOption[] = [];
  let availableUsers: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    role: string;
    unitCode?: string | null;
    unitName?: string | null;
  }[] = [];

  if (isDatabaseConfigured) {
    try {
      const [fetchedDocTypes, fetchedUnits, fetchedUsers] = await Promise.all([
        prisma.documentType.findMany({
          where: { isActive: true },
          select: {
            id: true,
            code: true,
            name: true,
            requiresExpiryTracking: true,
            defaultApprovalLevel: true,
          },
          orderBy: { name: "asc" },
        }),
        prisma.unit.findMany({
          where: { isActive: true },
          select: { id: true, code: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.user.findMany({
          where: { status: "ACTIVE" },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            unit: { select: { code: true, name: true } },
          },
          orderBy: [{ role: "desc" }, { lastName: "asc" }],
        }),
      ]);
      docTypes = fetchedDocTypes;
      units = fetchedUnits;
      availableUsers = fetchedUsers.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role,
        unitCode: u.unit?.code || null,
        unitName: u.unit?.name || null,
      }));
    } catch {
      docTypes = [];
      units = [];
      availableUsers = [];
    }
  }

  const isCrossUnit = user.role === "DIRECTOR" || user.role === "ADMIN";

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Ingest New Document
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Upload an initial version (v1) into the Student & Alumni Services repository.
        </p>
      </div>

      <DocumentUploadForm
        docTypes={docTypes}
        units={units}
        currentUserUnitId={user.unitId}
        isCrossUnit={isCrossUnit}
        availableUsers={availableUsers}
      />
    </div>
  );
}
