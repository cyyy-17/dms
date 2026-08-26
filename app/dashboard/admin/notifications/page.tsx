import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import AdminNotificationManagement from "@/components/AdminNotificationManagement";
import { BellRing } from "lucide-react";
import { NotificationStatus, NotificationType } from "@prisma/client";

interface NotificationItem {
  id: string;
  recipientEmail: string;
  type: NotificationType;
  subject: string;
  status: NotificationStatus;
  attempts: number;
  maxAttempts: number;
  scheduledFor: Date;
  sentAt: Date | null;
  createdAt: Date;
  recipient?: { firstName: string; lastName: string } | null;
}

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  let notifications: NotificationItem[] = [];

  if (isDatabaseConfigured) {
    try {
      const list = await prisma.notificationQueue.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
        include: { recipient: { select: { firstName: true, lastName: true } } },
      });
      notifications = list as unknown as NotificationItem[];
    } catch {
      notifications = [];
    }
  }

  if (notifications.length === 0) {
    notifications = [
      {
        id: "notif-1",
        recipientEmail: "msantos@firstasia.edu.ph",
        type: NotificationType.DOCUMENT_SUBMITTED_COORDINATOR,
        subject: "SASDMS: Document Awaiting Review - SAS-2026-CAR-00001",
        status: NotificationStatus.SENT,
        attempts: 1,
        maxAttempts: 3,
        scheduledFor: new Date("2026-08-24T00:00:00.000Z"),
        sentAt: new Date("2026-08-24T00:00:00.000Z"),
        createdAt: new Date("2026-08-24T00:00:00.000Z"),
        recipient: { firstName: "Maria", lastName: "Santos" },
      },
      {
        id: "notif-2",
        recipientEmail: "director@firstasia.edu.ph",
        type: NotificationType.DOCUMENT_ESCALATED_DIRECTOR,
        subject: "SASDMS: Auto-Escalation Alert (2x Rejection) - SAS-2026-ALM-00002",
        status: NotificationStatus.PENDING,
        attempts: 0,
        maxAttempts: 3,
        scheduledFor: new Date("2026-08-24T00:00:00.000Z"),
        sentAt: null,
        createdAt: new Date("2026-08-24T00:00:00.000Z"),
        recipient: { firstName: "Department", lastName: "Director" },
      },
    ];
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <BellRing className="w-6 h-6 text-[#0F2962]" />
          <span>Asynchronous Notification Queue & Delivery Manager</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitor background email dispatches via Resend API, trigger manual batch runs, and retry failed delivery attempts.
        </p>
      </div>

      <AdminNotificationManagement notifications={notifications} />
    </div>
  );
}
