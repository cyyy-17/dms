import { redirect } from "next/navigation";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAuthenticatedUser, AuthenticatedUser } from "@/lib/auth/session";
import { SEED_UNITS } from "@/lib/constants";
import AdminUserManagement from "@/components/AdminUserManagement";
import { Users, ShieldAlert } from "lucide-react";
import { UserRole, UserStatus } from "@prisma/client";

interface UserWithRelations {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeId: string | null;
  role: UserRole;
  status: UserStatus;
  unitId: string | null;
  createdAt: Date;
  unit: { id: string; code: string; name: string } | null;
}

interface UnitItem {
  id: string;
  code: string;
  name: string;
}

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const currentUser: AuthenticatedUser = (await getAuthenticatedUser()) || {
    id: "demo-admin-user",
    email: "admin@firstasia.edu.ph",
    firstName: "Admin",
    lastName: "System",
    fullName: "Admin System",
    employeeId: "EMP-ADMIN-001",
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    unitId: null,
    unitCode: null,
    unitName: null,
    signaturePath: null,
  };

  if (currentUser.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  let users: UserWithRelations[] = [];
  let units: UnitItem[] = [];

  if (isDatabaseConfigured) {
    try {
      const [dbUsers, dbUnits] = await Promise.all([
        prisma.user.findMany({
          include: { unit: { select: { id: true, code: true, name: true } } },
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        }),
        prisma.unit.findMany({
          where: { isActive: true },
          select: { id: true, code: true, name: true },
          orderBy: { name: "asc" },
        }),
      ]);

      users = dbUsers as unknown as UserWithRelations[];
      units = dbUnits;
    } catch {
      users = [];
      units = [];
    }
  }

  if (units.length === 0) {
    units = SEED_UNITS.map((u, idx) => ({
      id: `unit-${idx + 1}`,
      code: u.code,
      name: u.name,
    }));
  }

  if (users.length === 0) {
    users = [
      {
        id: "sample-user-pending",
        firstName: "Ricardo",
        lastName: "Dalisay",
        email: "rdalisay@firstasia.edu.ph",
        employeeId: "EMP-2026-092",
        role: UserRole.STAFF,
        status: UserStatus.PENDING_APPROVAL,
        unitId: units[0].id,
        createdAt: new Date(),
        unit: { id: units[0].id, code: units[0].code, name: units[0].name },
      },
      {
        id: "sample-user-coord",
        firstName: "Maria",
        lastName: "Santos",
        email: "msantos@firstasia.edu.ph",
        employeeId: "EMP-2024-012",
        role: UserRole.COORDINATOR,
        status: UserStatus.ACTIVE,
        unitId: units[0].id,
        createdAt: new Date(),
        unit: { id: units[0].id, code: units[0].code, name: units[0].name },
      },
    ];
  }

  const pendingCount = users.filter((u) => u.status === UserStatus.PENDING_APPROVAL).length;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0F2962]" />
            <span>Employee & User Access Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Provision staff directly, approve self-registrations, adjust unit assignments, and manage credentials.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto">
            <ShieldAlert className="w-4 h-4 text-amber-700" />
            <span>{pendingCount} Registration(s) Awaiting Approval</span>
          </div>
        )}
      </div>

      <AdminUserManagement users={users} units={units} />
    </div>
  );
}
