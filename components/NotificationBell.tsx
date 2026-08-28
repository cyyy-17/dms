"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  FileText,
  Clock,
  ExternalLink,
  RotateCcw,
  ShieldAlert,
  X,
  Check,
} from "lucide-react";

interface NotificationItem {
  id: string;
  subject: string;
  type: string;
  status: string;
  createdAt: string;
  trackingNumber: string | null;
  documentId: string | null;
  title: string | null;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function getNotificationIcon(type: string) {
  if (type.includes("APPROVED") || type.includes("SEALED")) {
    return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
  }
  if (type.includes("REJECT") || type.includes("RETURNED")) {
    return <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />;
  }
  if (type.includes("ESCALAT") || type.includes("WARNING")) {
    return <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />;
  }
  return <FileText className="w-4 h-4 text-blue-600 shrink-0" />;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("sasdms_read_notifications");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {
      // Keep existing
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!ignore) {
        await fetchNotifications();
      }
    }
    load();
    const interval = setInterval(fetchNotifications, 60000);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
    try {
      localStorage.setItem("sasdms_read_notifications", JSON.stringify(Array.from(allIds)));
    } catch {
      // Ignored
    }
  };

  const markSingleAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem("sasdms_read_notifications", JSON.stringify(Array.from(next)));
      } catch {
        // Ignored
      }
      return next;
    });
  };

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200/90 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0F2962]"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-3.5 h-3.5 text-[#0F2962]" />
        <span className="hidden sm:inline">Alerts</span>

        {unreadCount > 0 && (
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-black leading-none text-white bg-linear-to-r from-rose-500 to-red-600 rounded-full shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-auto mt-0 sm:mt-2 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-w-full">
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black bg-blue-100 text-blue-900 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] font-bold text-slate-500 hover:text-[#0F2962] transition px-2 py-1 rounded-lg hover:bg-white cursor-pointer"
                  title="Mark all as read"
                >
                  <Check className="w-3.5 h-3.5 inline mr-1" />
                  Mark read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white transition cursor-pointer"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-84 overflow-y-auto divide-y divide-slate-100">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Clock className="w-6 h-6 mx-auto mb-2 animate-spin text-slate-300" />
                Loading alerts...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">No new notifications</p>
                <p className="text-[11px] text-slate-400">You&apos;re all caught up with your document reviews.</p>
              </div>
            ) : (
              notifications.map((item) => {
                const isRead = readIds.has(item.id);
                const targetUrl = item.documentId
                  ? `/dashboard/documents/${item.documentId}`
                  : "/dashboard/approvals";

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 transition flex items-start gap-3 hover:bg-slate-50 ${
                      isRead ? "opacity-75 bg-white" : "bg-blue-50/40"
                    }`}
                  >
                    <div className="mt-0.5">{getNotificationIcon(item.type)}</div>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={targetUrl}
                        onClick={() => {
                          markSingleAsRead(item.id);
                          setIsOpen(false);
                        }}
                        className="block text-xs font-bold text-slate-900 hover:text-[#0F2962] line-clamp-2 leading-snug"
                      >
                        {item.subject}
                      </Link>

                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        {item.trackingNumber && (
                          <span className="font-mono font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.trackingNumber}
                          </span>
                        )}
                        <span>•</span>
                        <span>{timeAgo(item.createdAt)}</span>
                      </div>
                    </div>

                    {!isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200/80 text-center">
            <Link
              href="/dashboard/approvals"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-[#0F2962] hover:underline inline-flex items-center gap-1"
            >
              <span>View All Approvals & Tasks</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
