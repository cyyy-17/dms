import { redirect } from "next/navigation";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import AdminDocumentOverrideManagement from "@/components/AdminDocumentOverrideManagement";
import AdminRetentionSimulator from "@/components/AdminRetentionSimulator";
import { Wrench } from "lucide-react";
import { DocumentStatus, ApprovalLevel } from "@prisma/client";

interface DocumentWithDetails {
  id: string;
  trackingNumber: string;
  title: string;
  status: DocumentStatus;
  approvalLevel: ApprovalLevel;
  isEscalated: boolean;
  rejectionCount: number;
  createdAt: Date;
  updatedAt: Date;
  unit: { code: string; name: string };
  uploader: { firstName: string; lastName: string; email: string };
  documentType: { code: string; name: string };
  currentVersion?: { versionNumber: number; fileName: string } | null;
}

export const dynamic = "force-dynamic";

export default async function AdminDocumentsOverridePage() {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/dashboard");
  }

  let documents: DocumentWithDetails[] = [];

  if (isDatabaseConfigured) {
    try {
      const docs = await prisma.document.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          unit: { select: { code: true, name: true } },
          uploader: { select: { firstName: true, lastName: true, email: true } },
          documentType: { select: { code: true, name: true } },
          currentVersion: { select: { versionNumber: true, fileName: true } },
        },
      });
      documents = docs as unknown as DocumentWithDetails[];
    } catch {
      documents = [];
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Wrench className="w-6 h-6 text-[#0F2962]" />
          <span>Administrative Document Override & Archival Console</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Emergency state overrides, administrative unlocking of deadlocked reviews, and RA 10173 statutory compliance archival.
        </p>
      </div>

      <AdminRetentionSimulator />

      <AdminDocumentOverrideManagement documents={documents} />
    </div>
  );
}
