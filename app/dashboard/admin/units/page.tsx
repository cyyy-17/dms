import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { SEED_UNITS } from "@/lib/constants";
import AdminUnitManagement from "@/components/AdminUnitManagement";
import { Building2 } from "lucide-react";

interface UnitWithStats {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: {
    users: number;
    documents: number;
  };
}

export const dynamic = "force-dynamic";

export default async function AdminUnitsPage() {
  let units: UnitWithStats[] = [];

  if (isDatabaseConfigured) {
    try {
      const dbUnits = await prisma.unit.findMany({
        orderBy: { code: "asc" },
        include: {
          _count: {
            select: { users: true, documents: true },
          },
        },
      });
      units = dbUnits;
    } catch {
      units = [];
    }
  }

  if (units.length === 0) {
    units = SEED_UNITS.map((u, idx) => ({
      id: `unit-${idx + 1}`,
      code: u.code,
      name: u.name,
      description: u.description,
      isActive: true,
      createdAt: new Date("2026-08-24T00:00:00.000Z"),
      _count: {
        users: 2,
        documents: 5,
      },
    }));
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Building2 className="w-6 h-6 text-[#0F2962]" />
          <span>Department Units & Workflows Management</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Maintain official Student & Alumni Services departmental units, mandates, and active ingestion statuses.
        </p>
      </div>

      <AdminUnitManagement units={units} />
    </div>
  );
}
