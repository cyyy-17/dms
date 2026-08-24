"use client";

import { useState } from "react";
import { Download, Search, ShieldCheck } from "lucide-react";
import { AuditAction } from "@prisma/client";

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
    <div className="space-y-6">
      {/* Action / Filter Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-56 flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Actor, Tracking #, IP, or Event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
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
          className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 shrink-0 self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit CSV (RA 10173)</span>
        </button>
      </div>

      {/* Audit Table */}
      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-6">Timestamp (PHT)</th>
                <th className="py-3.5 px-6">Event Action</th>
                <th className="py-3.5 px-6">Actor</th>
                <th className="py-3.5 px-6">Target Entity</th>
                <th className="py-3.5 px-6">Client IP</th>
                <th className="py-3.5 px-6">Cryptographic Details / Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No audit events found.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6 text-slate-600 font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px] font-mono border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-900">
                      {log.actor ? (
                        <>
                          <span>
                            {log.actor.firstName} {log.actor.lastName}
                          </span>
                          <span className="text-[10px] text-slate-400 block">{log.actor.email}</span>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">System Worker</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {log.document ? (
                        <span className="font-mono font-bold text-slate-800 block">
                          {log.document.trackingNumber}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono text-[11px]">
                          {log.targetType}: {log.targetId || "N/A"}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px] text-slate-500">
                      {log.ipAddress || "127.0.0.1"}
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                      <div className="text-[11px] text-slate-600 truncate bg-slate-50 p-1.5 rounded border border-slate-200 font-mono">
                        {JSON.stringify(log.details)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
