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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredLogs = logs.filter((log) => {
    const logDate = new Date(log.createdAt);
    if (startDate && logDate < new Date(`${startDate}T00:00:00`)) return false;
    if (endDate && logDate > new Date(`${endDate}T23:59:59`)) return false;

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
    if (typeof window === "undefined") return;
    const headers = [
      "Timestamp (ISO)",
      "Action",
      "Actor Name",
      "Actor Email",
      "Target Type",
      "Target ID / Tracking #",
      "IP Address",
      "Details",
    ];
    const rows = filteredLogs.map((l) => [
      new Date(l.createdAt).toISOString(),
      l.action,
      l.actor ? `"${l.actor.firstName} ${l.actor.lastName}"` : '"System Automated Worker"',
      l.actor ? `"${l.actor.email}"` : '"system@firstasia.edu.ph"',
      `"${l.targetType}"`,
      l.document ? `"${l.document.trackingNumber}"` : `"${l.targetId || "N/A"}"`,
      `"${l.ipAddress || "127.0.0.1"}"`,
      `"${JSON.stringify(l.details).replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `SASDMS_Compliance_Audit_Trail_${new Date().toISOString().split("T")[0]}.csv`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    if (typeof window === "undefined") return;
    const exportPayload = {
      institution: "First Asia Institute of Technology and Humanities",
      system: "Student Affairs and Services Document Management System (SASDMS)",
      governanceFramework: "Republic Act No. 10173 (Data Privacy Act of 2012)",
      exportTimestamp: new Date().toISOString(),
      recordCount: filteredLogs.length,
      filtersApplied: {
        searchQuery: searchQuery || null,
        actionFilter,
        startDate: startDate || null,
        endDate: endDate || null,
      },
      auditRecords: filteredLogs.map((l) => ({
        id: l.id,
        timestamp: new Date(l.createdAt).toISOString(),
        action: l.action,
        actionLabel: getActionLabel(l.action),
        targetType: l.targetType,
        targetId: l.targetId,
        trackingNumber: l.document?.trackingNumber || null,
        documentTitle: l.document?.title || null,
        actor: l.actor
          ? {
              fullName: `${l.actor.firstName} ${l.actor.lastName}`,
              email: l.actor.email,
            }
          : {
              fullName: "System Automated Worker",
              email: "system@firstasia.edu.ph",
            },
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        details: l.details,
      })),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `SASDMS_Audit_Report_${new Date().toISOString().split("T")[0]}.json`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Action / Filter Bar */}
      <div className="glass-panel rounded-3xl p-4.5 border border-white/90 shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Actor, Tracking #, IP, or Event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/90 border border-slate-300/90 rounded-xl focus:ring-2 focus:ring-[#0F2962] transition shadow-inner text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full sm:w-auto text-xs py-2.5 px-3.5 bg-white/90 border border-slate-300/90 rounded-xl focus:ring-2 focus:ring-[#0F2962] transition shadow-inner text-slate-900 font-bold"
            >
              <option value="ALL">All Event Actions</option>
              <option value="USER_REGISTER">User Account Registered</option>
              <option value="USER_APPROVE">Account Verified & Approved</option>
              <option value="USER_REJECT">Registration Request Denied</option>
              <option value="USER_SUSPEND">Account Suspended</option>
              <option value="USER_ROLE_CHANGE">Role / Unit Reassigned</option>
              <option value="DOCUMENT_CREATE">Document Ingested into Vault</option>
              <option value="DOCUMENT_VERSION_UPLOAD">New Version Attached</option>
              <option value="DOCUMENT_VIEW">Document Inspected (View)</option>
              <option value="DOCUMENT_DOWNLOAD">Document PDF Exported (Download)</option>
              <option value="DOCUMENT_SUBMIT">Submitted for Sequential Review</option>
              <option value="DOCUMENT_APPROVE_COORDINATOR">Approved by Unit Coordinator</option>
              <option value="DOCUMENT_APPROVE_DIRECTOR">Executive Approval by Director</option>
              <option value="DOCUMENT_REJECT_RETURN">Returned for Author Revision</option>
              <option value="DOCUMENT_REJECT_CLOSE">Permanently Terminated / Closed</option>
              <option value="DOCUMENT_AUTO_ESCALATE">Auto-Escalated to Director</option>
              <option value="DOCUMENT_ARCHIVE">RA 10173 Compliance Archival</option>
              <option value="DOCUMENT_EXPIRY_ALERT">Document Expiry Alert Dispatched</option>
              <option value="DOCUMENT_PURGE">Automated Retention Cleanup</option>
              <option value="DELEGATION_ASSIGNED">Acting Signatory Delegated</option>
              <option value="DELEGATION_REVOKED">Acting Signatory Revoked</option>
            </select>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportToCSV}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Export filtered records as standard CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={exportToJSON}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-[#0F2962] hover:bg-[#091a42] text-white text-xs font-bold shadow-xs hover:shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Export full compliance package with audit integrity headers in JSON"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Compliance JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Date Range Sub-Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100/90 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-bold">Date Range:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
              />
              <span className="text-slate-400 font-bold text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
              />
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="text-[11px] text-blue-700 hover:underline font-bold cursor-pointer ml-1"
                >
                  Clear Dates
                </button>
              )}
            </div>
          </div>
          <span className="text-slate-400 text-[11px] font-mono">
            {filteredLogs.length} matching event(s)
          </span>
        </div>
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
