import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { SEED_UNITS } from "@/lib/constants";
import AdminDelegationManagement from "@/components/AdminDelegationManagement";
import { FileCheck2 } from "lucide-react";

interface DelegationItem {
  id: string;
  delegatorId: string;
  delegateId: string;
  unitId: string;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  isActive: boolean;
  createdAt: Date;
  delegator: { firstName: string; lastName: string; role: string };
  delegate: { firstName: string; lastName: string; email: string; role: string };
  unit: { code: string; name: string };
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  unitId: string | null;
}

interface UnitOption {
  id: string;
  code: string;
  name: string;
}

export const dynamic = "force-dynamic";

export default async function AdminDelegationsPage() {
  let delegations: DelegationItem[] = [];
  let users: UserOption[] = [];
  let units: UnitOption[] = [];

  if (isDatabaseConfigured) {
    try {
      const [dbDelegations, dbUsers, dbUnits] = await Promise.all([
        prisma.delegateSignatory.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            delegator: { select: { firstName: true, lastName: true, role: true } },
            delegate: { select: { firstName: true, lastName: true, email: true, role: true } },
            unit: { select: { code: true, name: true } },
          },
        }),
        prisma.user.findMany({
          where: { status: "ACTIVE" },
          select: { id: true, firstName: true, lastName: true, email: true, role: true, unitId: true },
          orderBy: { firstName: "asc" },
        }),
        prisma.unit.findMany({
          where: { isActive: true },
          select: { id: true, code: true, name: true },
          orderBy: { name: "asc" },
        }),
      ]);

      delegations = dbDelegations as unknown as DelegationItem[];
      users = dbUsers;
      units = dbUnits;
    } catch {
      delegations = [];
      users = [];
      units = [];
    }
  }

  if (units.length === 0) {
    units = SEED_UNITS.map((u, i) => ({ id: `unit-${i + 1}`, code: u.code, name: u.name }));
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <FileCheck2 className="w-6 h-6 text-[#0F2962]" />
          <span>Signatory Delegations & OIC Designations</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Assign, track, and revoke temporary acting signatory powers during official leaves and institutional reassignments.
        </p>
      </div>

      <AdminDelegationManagement delegations={delegations} users={users} units={units} />
    </div>
  );
}
