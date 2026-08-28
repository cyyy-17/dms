"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
} from "lucide-react";
import { DocumentStatus } from "@prisma/client";

interface CalendarDocItem {
  id: string;
  trackingNumber: string;
  title: string;
  status: DocumentStatus;
  expiryDate?: Date | string | null;
  unit?: { code: string; name: string } | null;
}

interface ExpiryCalendarViewProps {
  documents: CalendarDocItem[];
}

export default function ExpiryCalendarView({ documents }: ExpiryCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayDocs, setSelectedDayDocs] = useState<{
    dateStr: string;
    docs: CalendarDocItem[];
  } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in Month calculation
  const { monthName, calendarMatrix } = useMemo(() => {
    const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay(); // 0 is Sunday

    const matrix: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      matrix.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      matrix.push(d);
    }
    // Pad to full weeks (multiples of 7)
    while (matrix.length % 7 !== 0) {
      matrix.push(null);
    }

    return { monthName, daysInMonth, firstDayOfWeek, calendarMatrix: matrix };
  }, [year, month, currentDate]);

  // Group documents with expiry dates into day buckets
  const docsByDay = useMemo(() => {
    const map = new Map<number, CalendarDocItem[]>();

    for (const doc of documents) {
      if (!doc.expiryDate) continue;
      const exp = new Date(doc.expiryDate);
      if (exp.getFullYear() === year && exp.getMonth() === month) {
        const day = exp.getDate();
        const existing = map.get(day) || [];
        existing.push(doc);
        map.set(day, existing);
      }
    }

    return map;
  }, [documents, year, month]);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const resetToday = () => setCurrentDate(new Date());

  const getUrgencyBadge = (expiryDate: Date | string) => {
    const exp = new Date(expiryDate);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: "Expired",
        className: "bg-red-500 text-white font-black",
      };
    }
    if (diffDays <= 30) {
      return {
        label: `${diffDays}d left`,
        className: "bg-rose-100 text-rose-900 border-rose-200 font-black",
      };
    }
    if (diffDays <= 90) {
      return {
        label: `${diffDays}d left`,
        className: "bg-amber-100 text-amber-900 border-amber-200 font-bold",
      };
    }
    return {
      label: `${diffDays}d left`,
      className: "bg-emerald-100 text-emerald-900 border-emerald-200 font-bold",
    };
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-4 sm:p-5 rounded-3xl bg-white/90 border border-white/90 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0F2962] flex items-center justify-center font-black border border-blue-100 shadow-xs">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">{monthName}</h2>
            <p className="text-xs text-slate-500 font-medium">
              Document Expiry & Lifecycle Schedule
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold text-slate-600 mr-2 border-r border-slate-200 pr-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              &lt;30d (Urgent)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              30-90d
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              &gt;90d (Healthy)
            </span>
          </div>

          <button
            type="button"
            onClick={resetToday}
            className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center rounded-xl border border-slate-300 bg-white p-0.5 shadow-xs">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Month Grid */}
      <div className="glass-panel rounded-3xl p-4 sm:p-6 border border-white/90 bg-white/90 shadow-sm overflow-hidden">
        {/* Day Name Headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {dayNames.map((d, i) => (
            <div
              key={d}
              className={`text-center py-2 text-[11px] font-black uppercase tracking-wider ${
                i === 0 || i === 6 ? "text-slate-400" : "text-[#0F2962]"
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Matrix Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {calendarMatrix.map((dayNum, idx) => {
            if (dayNum === null) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-24 sm:min-h-28 rounded-2xl bg-slate-50/50 border border-slate-100/60 p-2 opacity-30"
                />
              );
            }

            const dayDocs = docsByDay.get(dayNum) || [];
            const isToday = isCurrentMonth && dayNum === today.getDate();

            return (
              <div
                key={`day-${dayNum}`}
                onClick={() => {
                  if (dayDocs.length > 0) {
                    setSelectedDayDocs({
                      dateStr: `${monthName} ${dayNum}`,
                      docs: dayDocs,
                    });
                  }
                }}
                className={`min-h-24 sm:min-h-28 rounded-2xl p-2 sm:p-2.5 border transition-all flex flex-col justify-between ${
                  dayDocs.length > 0
                    ? "cursor-pointer hover:shadow-md hover:border-blue-300 hover:bg-blue-50/30"
                    : ""
                } ${
                  isToday
                    ? "border-[#0F2962] bg-blue-50/50 ring-2 ring-[#0F2962]/20"
                    : "border-slate-200/80 bg-white/80"
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                      isToday
                        ? "bg-[#0F2962] text-white shadow-xs"
                        : "text-slate-700"
                    }`}
                  >
                    {dayNum}
                  </span>

                  {dayDocs.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-[#0F2962] text-[10px] font-black">
                      {dayDocs.length}
                    </span>
                  )}
                </div>

                {/* Expiry Snippets */}
                <div className="space-y-1 mt-1.5 overflow-hidden">
                  {dayDocs.slice(0, 2).map((doc) => {
                    const badge = getUrgencyBadge(doc.expiryDate!);
                    return (
                      <div
                        key={doc.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded-md border truncate ${badge.className}`}
                        title={doc.title}
                      >
                        {doc.trackingNumber}
                      </div>
                    );
                  })}
                  {dayDocs.length > 2 && (
                    <span className="text-[10px] text-slate-400 font-bold block text-center">
                      +{dayDocs.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Details Modal / Drawer */}
      {selectedDayDocs && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="glass-panel rounded-3xl max-w-lg w-full p-6 border border-white/90 bg-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#0F2962]" />
                <h3 className="text-base font-black text-slate-900">
                  Expiring on {selectedDayDocs.dateStr}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayDocs(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2.5">
              {selectedDayDocs.docs.map((doc) => {
                const badge = getUrgencyBadge(doc.expiryDate!);
                return (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-3 hover:bg-white transition"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {doc.trackingNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium truncate">
                        {doc.title}
                      </p>
                      {doc.unit && (
                        <span className="text-[10px] text-slate-400 block font-bold font-mono">
                          Unit: {doc.unit.code}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/dashboard/documents/${doc.id}`}
                      className="px-3 py-1.5 rounded-xl bg-[#0F2962] hover:bg-[#091a42] text-white text-xs font-bold flex items-center gap-1 shrink-0 transition shadow-xs cursor-pointer"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
