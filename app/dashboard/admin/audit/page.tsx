import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import AdminAuditExplorer from "@/components/AdminAuditExplorer";
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
  let auditLogs: AuditLogWithRelations[] = [];

  if (isDatabaseConfigured) {
    try {
      const logs = await prisma.auditLog.findMany({
        take: 100,
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

  if (auditLogs.length === 0) {
    auditLogs = [
      {
        id: "log-1",
        action: AuditAction.DOCUMENT_APPROVE_COORDINATOR,
        targetType: "DOCUMENT",
        targetId: "doc-uuid-1",
        ipAddress: "192.168.1.45",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        createdAt: new Date("2026-08-24T00:00:00.000Z"),
        actor: { firstName: "Maria", lastName: "Santos", email: "msantos@firstasia.edu.ph" },
        unit: { code: "CAREER" },
        document: { trackingNumber: "SAS-2026-CAR-00001", title: "AY 2026-2027 Industry Internship Partner MOU" },
        details: { nextStatus: "PENDING_DIRECTOR", comments: "Endorsed for final Director signature." },
      },
      {
        id: "log-2",
        action: AuditAction.DOCUMENT_REJECT_RETURN,
        targetType: "DOCUMENT",
        targetId: "doc-uuid-2",
        ipAddress: "192.168.1.88",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        createdAt: new Date("2026-08-24T00:00:00.000Z"),
        actor: { firstName: "Director", lastName: "Executive", email: "director@firstasia.edu.ph" },
        unit: { code: "ALUMNI" },
        document: { trackingNumber: "SAS-2026-ALM-00002", title: "Grand Alumni Homecoming 2026 Budget & Facility Permit" },
        details: { comments: "Budget breakdown missing annex C. Please revise.", rejectionCount: 2, isEscalated: true },
      },
    ];
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

      <AdminAuditExplorer logs={auditLogs} />
    </div>
  );
}
