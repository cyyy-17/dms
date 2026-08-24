import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import AdminDocumentOverrideManagement from "@/components/AdminDocumentOverrideManagement";
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

  if (documents.length === 0) {
    documents = [
      {
        id: "sample-doc-1",
        trackingNumber: "SAS-2026-CAR-00001",
        title: "AY 2026-2027 Industry Internship Partner MOU",
        status: DocumentStatus.PENDING_DIRECTOR,
        approvalLevel: ApprovalLevel.DIRECTOR_REQUIRED,
        isEscalated: false,
        rejectionCount: 0,
        createdAt: new Date("2026-08-24T00:00:00.000Z"),
        updatedAt: new Date("2026-08-24T00:00:00.000Z"),
        unit: { code: "CAREER", name: "Career Services & Placement" },
        uploader: { firstName: "Juan", lastName: "Dela Cruz", email: "jdelacruz@firstasia.edu.ph" },
        documentType: { code: "MOU_MOA", name: "Memorandum of Agreement / Understanding" },
        currentVersion: { versionNumber: 1, fileName: "Industry_Partner_MOU.pdf" },
      },
      {
        id: "sample-doc-2",
        trackingNumber: "SAS-2026-ALM-00002",
        title: "Grand Alumni Homecoming 2026 Budget & Facility Permit",
        status: DocumentStatus.REJECTED_RETURNED,
        approvalLevel: ApprovalLevel.DIRECTOR_REQUIRED,
        isEscalated: true,
        rejectionCount: 2,
        createdAt: new Date("2026-08-24T00:00:00.000Z"),
        updatedAt: new Date("2026-08-24T00:00:00.000Z"),
        unit: { code: "ALUMNI", name: "Alumni Relations & Affairs" },
        uploader: { firstName: "Maria", lastName: "Santos", email: "msantos@firstasia.edu.ph" },
        documentType: { code: "CAMPUS_PERMIT", name: "Off-Campus / Campus Facility Permit" },
        currentVersion: { versionNumber: 2, fileName: "Homecoming_Permit_v2.pdf" },
      },
    ];
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Wrench className="w-6 h-6 text-[#0F2962]" />
          <span>Administrative Document Override & Archival Console</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Emergency state overrides, administrative unlocking of deadlocked reviews, and RA 10173 statutory compliance archival.
        </p>
      </div>

      <AdminDocumentOverrideManagement documents={documents} />
    </div>
  );
}
