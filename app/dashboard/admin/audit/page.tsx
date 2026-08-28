import { redirect } from "next/navigation";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import AdminAuditExplorer from "@/components/AdminAuditExplorer";
import AdminHealthWidget from "@/components/AdminHealthWidget";
import ApprovalVelocityWidget from "@/components/ApprovalVelocityWidget";
import { ShieldCheck } from "lucide-react";
import { AuditAction } from "@prisma/client";

interface AuditLogWithRelations {
  id: string;
  action: AuditAction;
  targetType: string;
  targetId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  details: unknown;
  actor?: { firstName: string; lastName: string; email: string } | null;
  unit?: { code: string } | null;
  document?: { trackingNumber: string; title: string } | null;
}

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/dashboard");
  }

  let auditLogs: AuditLogWithRelations[] = [];

  if (isDatabaseConfigured) {
    try {
      const logs = await prisma.auditLog.findMany({
        take: 500,
        orderBy: { createdAt: "desc" },
        include: {
          actor: { select: { firstName: true, lastName: true, email: true } },
          unit: { select: { code: true } },
          document: { select: { trackingNumber: true, title: true } },
        },
      });
      auditLogs = logs as unknown as AuditLogWithRelations[];
    } catch {
      auditLogs = [];
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <span>RA 10173 Compliance & Security Audit Trail</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Immutable event ledger tracking every document ingestion, download, approval, and administrative intervention.
        </p>
      </div>

      <AdminHealthWidget />

      <ApprovalVelocityWidget />

      <AdminAuditExplorer logs={auditLogs} />
    </div>
  );
}
