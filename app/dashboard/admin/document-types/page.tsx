import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import AdminDocTypeManagement from "@/components/AdminDocTypeManagement";
import { FileCode2 } from "lucide-react";
import { ApprovalLevel } from "@prisma/client";

interface DocTypeItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  defaultApprovalLevel: ApprovalLevel;
  requiresExpiryTracking: boolean;
  defaultRetentionDays: number;
  isActive: boolean;
  _count?: {
    documents: number;
  };
}

export const dynamic = "force-dynamic";

export default async function AdminDocumentTypesPage() {
  let docTypes: DocTypeItem[] = [];

  if (isDatabaseConfigured) {
    try {
      const types = await prisma.documentType.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { documents: true },
          },
        },
      });
      docTypes = types;
    } catch {
      docTypes = [];
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <FileCode2 className="w-6 h-6 text-[#0F2962]" />
          <span>Document Classification Types & Compliance Rules</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure institutional document categories, approval chain rules, expiry alert thresholds, and statutory RA 10173 retention periods.
        </p>
      </div>

      <AdminDocTypeManagement docTypes={docTypes} />
    </div>
  );
}
