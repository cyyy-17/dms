"use client";

import { useState } from "react";
import { Download, Search } from "lucide-react";
import DataTableWrapper from "@/components/DataTableWrapper";
import { AuditAction } from "@prisma/client";
import {
  getActionLabel,
  getTargetTypeLabel,
  formatHumanDateTime,
  formatAuditDetailsSummary,
} from "@/lib/status-labels";

interface AuditLogItem {
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

export default function AdminAuditExplorer({ logs }: { logs: AuditLogItem[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.actor && `${log.actor.firstName} ${log.actor.lastName} ${log.actor.email}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.document && log.document.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.ipAddress && log.ipAddress.includes(searchQuery));

    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const exportToCSV = () => {
    const headers = ["Timestamp (ISO)", "Action", "Actor Name", "Actor Email", "Target Type", "Target ID / Tracking #", "IP Address", "Details"];
    const rows = filteredLogs.map((l) => [
      new Date(l.createdAt).toISOString(),
      l.action,
      l.actor ? `${l.actor.firstName} ${l.actor.lastName}` : "System",
      l.actor ? l.actor.email : "system@firstasia.edu.ph",
      l.targetType,
      l.document ? l.document.trackingNumber : (l.targetId || "N/A"),
      l.ipAddress || "127.0.0.1",
      `"${JSON.stringify(l.details).replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SASDMS_Audit_Trail_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Action / Filter Bar */}
      <div className="glass-panel rounded-3xl p-4.5 border border-white/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-64 flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Actor, Tracking #, IP, or Event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/90 border border-slate-300/90 rounded-xl focus:ring-2 focus:ring-[#0F2962] transition shadow-inner text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs py-2.5 px-3.5 bg-white/90 border border-slate-300/90 rounded-xl focus:ring-2 focus:ring-[#0F2962] transition shadow-inner text-slate-900 font-bold"
          >
            <option value="ALL">All Event Actions</option>
            <option value="USER_REGISTER">USER_REGISTER</option>
            <option value="USER_APPROVE">USER_APPROVE</option>
            <option value="USER_REJECT">USER_REJECT</option>
            <option value="USER_ROLE_CHANGE">USER_ROLE_CHANGE</option>
            <option value="DOCUMENT_CREATE">DOCUMENT_CREATE</option>
            <option value="DOCUMENT_SUBMIT">DOCUMENT_SUBMIT</option>
            <option value="DOCUMENT_APPROVE_COORDINATOR">DOCUMENT_APPROVE_COORDINATOR</option>
            <option value="DOCUMENT_APPROVE_DIRECTOR">DOCUMENT_APPROVE_DIRECTOR</option>
            <option value="DOCUMENT_REJECT_RETURN">DOCUMENT_REJECT_RETURN</option>
            <option value="DOCUMENT_ADMIN_OVERRIDE">DOCUMENT_ADMIN_OVERRIDE</option>
            <option value="DOCUMENT_ARCHIVE_RA10173">DOCUMENT_ARCHIVE_RA10173</option>
          </select>
        </div>

        <button
          onClick={exportToCSV}
          className="px-4.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 shrink-0 self-start md:self-auto cursor-pointer hover:-translate-y-0.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-3xl border border-white/90 overflow-hidden shadow-sm">
        <DataTableWrapper>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">Action Event</th>
                <th className="py-3.5 px-6">Actor</th>
                <th className="py-3.5 px-6">Target Record</th>
                <th className="py-3.5 px-6">IP / Network</th>
                <th className="py-3.5 px-6">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/90 bg-white/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                    No audit records matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/40 transition-colors duration-150">
                    <td className="py-4 px-6 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {formatHumanDateTime(log.createdAt)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-[10px] font-black px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 shadow-xs">
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 block">
                        {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : "System Automated Worker"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                        {log.actor ? log.actor.email : "system@firstasia.edu.ph"}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium">
                      <span className="text-slate-500 text-[11px] block">{getTargetTypeLabel(log.targetType)}</span>
                      <span className="font-mono font-bold text-blue-900 block mt-0.5">
                        {log.document ? log.document.trackingNumber : (log.targetId ? `Record #${log.targetId.substring(0, 8)}` : "System-wide")}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px] text-slate-500">
                      {log.ipAddress || "Internal Server"}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-[11px] text-slate-700 bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/80 max-w-sm leading-relaxed font-medium">
                        {formatAuditDetailsSummary(log.details)}
                      </div>
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
