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
