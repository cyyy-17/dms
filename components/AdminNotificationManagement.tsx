"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { retryNotificationAction, clearNotificationQueueAction } from "@/actions/admin";
import {
  RotateCcw,
  Trash2,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  X,
} from "lucide-react";
import { NotificationStatus, NotificationType } from "@prisma/client";
import { formatHumanDateTime } from "@/lib/status-labels";
import DataTableWrapper from "@/components/DataTableWrapper";

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

export default function AdminNotificationManagement({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch =
      n.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.recipient &&
        `${n.recipient.firstName} ${n.recipient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || n.status === statusFilter;
    const matchesType = typeFilter === "ALL" || n.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleRetry = async (id: string) => {
    setIsLoading(true);
    setFeedback(null);

    const res = await retryNotificationAction(id);
    setIsLoading(false);
    if (res.success) {
      setFeedback({ type: "success", message: "Notification queued for immediate retry." });
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to queue retry." });
    }
  };

  const handleClearSent = async () => {
    setIsLoading(true);
    setFeedback(null);

    const res = await clearNotificationQueueAction(true);
    setIsLoading(false);
    if (res.success) {
      setFeedback({ type: "success", message: `Purged ${res.count ?? 0} delivered notification logs.` });
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to purge queue." });
    }
  };

  const handleTriggerDispatch = async () => {
    setIsLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/cron/notifications", {
        method: "GET",
      });
      const data = await response.json();

      setIsLoading(false);
      setFeedback({
        type: "success",
        message: `Vercel Cron batch processor completed: Processed ${data.processed ?? 0} emails (${data.sent ?? 0} sent, ${data.failed ?? 0} failed).`,
      });
      router.refresh();
    } catch {
      setIsLoading(false);
      setFeedback({ type: "error", message: "Failed to invoke background email worker." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action / Filter Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-56 flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Recipient Email or Subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="SENT">SENT</option>
            <option value="FAILED">FAILED</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
          >
            <option value="ALL">All Notification Types</option>
            <option value="REGISTRATION_REQUEST_ADMIN">Admin Registration Alerts</option>
            <option value="ACCOUNT_APPROVED">Account Approvals</option>
            <option value="DOCUMENT_SUBMITTED_COORDINATOR">Coordinator Reviews</option>
            <option value="DOCUMENT_SUBMITTED_DIRECTOR">Director Approvals</option>
            <option value="DOCUMENT_ESCALATED_DIRECTOR">Escalation Alerts</option>
            <option value="DOCUMENT_APPROVED_ALL">Document Approvals</option>
            <option value="DOCUMENT_RETURNED_STAFF">Document Returns</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-auto">
          <button
            onClick={handleTriggerDispatch}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-lg bg-[#0F2962] hover:bg-[#091a42] text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-amber-400" />
            <span>Trigger Resend Batch</span>
          </button>

          <button
            onClick={handleClearSent}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Purge Delivered</span>
          </button>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <DataTableWrapper>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-6">Recipient</th>
                <th className="py-3.5 px-6">Event Type & Subject</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Delivery Attempts</th>
                <th className="py-3.5 px-6">Timestamps</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No notification queue records found.
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-900 block">
                        {n.recipient ? `${n.recipient.firstName} ${n.recipient.lastName}` : "Institutional User"}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400 block">{n.recipientEmail}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-800 block truncate max-w-sm">{n.subject}</span>
                      <span className="font-mono text-[10px] text-slate-400 block mt-0.5">{n.type.replace(/_/g, " ")}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          n.status === NotificationStatus.SENT
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : n.status === NotificationStatus.PENDING
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-red-100 text-red-800 border border-red-200"
                        }`}
                      >
                        {n.status === NotificationStatus.SENT && <CheckCircle className="w-3 h-3" />}
                        {n.status === NotificationStatus.PENDING && <Clock className="w-3 h-3" />}
                        {n.status === NotificationStatus.FAILED && <AlertCircle className="w-3 h-3" />}
                        <span>
                          {n.status === NotificationStatus.SENT
                            ? "Dispatched"
                            : n.status === NotificationStatus.PENDING
                            ? "In Queue"
                            : "Delivery Failed"}
                        </span>
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-700">
                      {n.attempts} / {n.maxAttempts}
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-[11px] font-mono">
                      {n.sentAt ? (
                        <span>Sent: {formatHumanDateTime(n.sentAt)}</span>
                      ) : (
                        <span>Sched: {formatHumanDateTime(n.scheduledFor)}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {n.status === NotificationStatus.FAILED && (
                        <button
                          onClick={() => handleRetry(n.id)}
                          disabled={isLoading}
                          className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableWrapper>
      </div>
    </div>
  );
}
