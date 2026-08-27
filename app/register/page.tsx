import Link from "next/link";
import Image from "next/image";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import RegisterForm from "@/components/RegisterForm";
import { ArrowLeft, MapPin } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 sm:py-16 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-amber-400 selection:text-slate-950">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-125 bg-linear-to-tr from-blue-900/40 via-indigo-900/30 to-amber-500/15 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-blue-950/40 blur-[130px] pointer-events-none rounded-full" />

      {/* Top Bar / Back Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl mb-4 px-4 sm:px-0 flex items-center justify-between z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition group py-1.5 px-3 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Institutional Portal</span>
        </Link>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <MapPin className="w-3 h-3 text-amber-400" />
          <span>Tanauan City, Batangas</span>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center relative z-10 space-y-3">
        <Link href="/" className="inline-flex items-center space-x-2 group">
          <div className="w-16 h-16 rounded-2xl bg-white/95 p-1.5 flex items-center justify-center shadow-xl shadow-blue-950/80 border border-amber-400/50 group-hover:scale-105 transition-all duration-300">
            <Image
              src="/images/faith-crest.png"
              alt="FAITH Crest"
              width={48}
              height={48}
              className="w-auto h-full object-contain"
              priority
            />
          </div>
        </Link>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Employee Self-Registration
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-md mx-auto">
          Student & Alumni Services • First Asia Institute of Technology and Humanities
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0 relative z-10">
        <RegisterForm units={units} />
      </div>
    </div>
  );
}
