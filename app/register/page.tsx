import Link from "next/link";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { SEED_UNITS } from "@/lib/constants";
import RegisterForm from "@/components/RegisterForm";

interface UnitOption {
  id: string;
  code: string;
  name: string;
}

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  let units: UnitOption[] = [];

  if (isDatabaseConfigured) {
    try {
      units = await prisma.unit.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true },
        orderBy: { name: "asc" },
      });
    } catch {
      units = [];
    }
  }

  if (units.length === 0) {
    units = SEED_UNITS.map((u, idx) => ({
      id: `placeholder-unit-${idx + 1}`,
      code: u.code,
      name: u.name,
    }));
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2">
          <div className="w-12 h-12 rounded-xl bg-[#0F2962] flex items-center justify-center text-amber-400 font-bold text-xl shadow-md">
            FA
          </div>
        </Link>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
          Employee Self-Registration
        </h1>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Student & Alumni Services • First Asia Institute of Technology and Humanities
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <RegisterForm units={units} />
      </div>
    </div>
  );
}
