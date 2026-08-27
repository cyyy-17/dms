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
    <div className="h-screen max-h-screen min-h-screen bg-slate-950 flex flex-col justify-between py-4 sm:py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-amber-400 selection:text-slate-950">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-125 bg-linear-to-tr from-blue-900/40 via-indigo-900/30 to-amber-500/15 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-blue-950/40 blur-[130px] pointer-events-none rounded-full" />

      {/* Top Bar / Back Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl mb-2 sm:mb-3 flex items-center justify-between z-10 shrink-0">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition group py-1.5 px-3 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Institutional Portal</span>
        </Link>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <MapPin className="w-3 h-3 text-amber-400" />
          <span>Tanauan City, Batangas</span>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center relative z-10 space-y-1.5 shrink-0 my-auto">
        <div className="flex items-center justify-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-white/95 p-1 flex items-center justify-center shadow-lg border border-amber-400/50">
            <Image
              src="/images/faith-crest.png"
              alt="FAITH Crest"
              width={34}
              height={34}
              className="w-auto h-full object-contain"
              priority
            />
          </div>
          <div className="text-left">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Employee Self-Registration
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Student &amp; Alumni Services • FAITH Colleges
            </p>
          </div>
        </div>

        <div className="mt-3">
          <RegisterForm units={units} />
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center text-[10.5px] text-slate-500 font-mono py-1 shrink-0">
        <span>Strict Zero-Trust Pre-Auth Whitelist Guard Active</span>
      </div>
    </div>
  );
}
