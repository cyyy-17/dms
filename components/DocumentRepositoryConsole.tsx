"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getStatusLabel, getStatusBadgeClass } from "@/lib/status-labels";
import {
  FileText,
  Search,
  Plus,
  AlertTriangle,
  Calendar,
  LayoutGrid,
  List,
  Download,
} from "lucide-react";
import { DocumentStatus } from "@prisma/client";

export interface DocumentRow {
  id: string;
  trackingNumber: string;
  title: string;
  status: DocumentStatus;
  isEscalated: boolean;
  rejectionCount: number;
  createdAt: Date | string;
  expiryDate: Date | string | null;
  unit: { code: string; name: string } | null;
  uploader: { firstName: string; lastName: string } | null;
  documentType: { name: string } | null;
  currentVersion: { versionNumber: number; fileName: string; fileSize: number } | null;
}

interface UnitOption {
  id: string;
  name: string;
  code: string;
}

interface DocTypeOption {
  id: string;
  name: string;
  code: string;
}

interface DocumentRepositoryConsoleProps {
  initialDocuments: DocumentRow[];
  units: UnitOption[];
  documentTypes: DocTypeOption[];
  userRole: string;
  isDirectorOrAdmin: boolean;
}

export default function DocumentRepositoryConsole({
  initialDocuments,
  units,
  documentTypes,
  isDirectorOrAdmin,
}: DocumentRepositoryConsoleProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL");
  const [selectedDocType, setSelectedDocType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [onlyEscalated, setOnlyEscalated] = useState(false);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return initialDocuments.filter((doc) => {
      // Search term
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTracking = doc.trackingNumber.toLowerCase().includes(q);
        const matchesTitle = doc.title.toLowerCase().includes(q);
        const matchesUploader = doc.uploader
          ? `${doc.uploader.firstName} ${doc.uploader.lastName}`.toLowerCase().includes(q)
          : false;
        if (!matchesTracking && !matchesTitle && !matchesUploader) return false;
      }

      // Unit filter
      if (selectedUnit !== "ALL" && doc.unit?.code !== selectedUnit) {
        return false;
      }

      // Doc type filter
      if (selectedDocType !== "ALL" && doc.documentType?.name !== selectedDocType) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "ALL" && doc.status !== selectedStatus) {
        return false;
      }

      // Escalated filter
      if (onlyEscalated && !doc.isEscalated) {
        return false;
      }

      return true;
    });
  }, [initialDocuments, searchQuery, selectedUnit, selectedDocType, selectedStatus, onlyEscalated]);

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ["Tracking Number", "Title", "Unit", "Type", "Status", "Escalated", "Uploader", "Created At"];
    const rows = filteredDocuments.map((d) => [
      d.trackingNumber,
      `"${d.title.replace(/"/g, '""')}"`,
      d.unit?.code || "GENERAL",
      d.documentType?.name || "General",
      d.status,
      d.isEscalated ? "YES" : "NO",
      d.uploader ? `${d.uploader.firstName} ${d.uploader.lastName}` : "Staff",
      new Date(d.createdAt).toISOString(),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SASDMS_Repository_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Document Repository
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0F2962] text-xs font-bold font-mono">
              {filteredDocuments.length} Records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete institutional archive with Smart Anchor e-signature tracking and audit history.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <Link
            href="/dashboard/documents/new"
            className="px-4 py-2 rounded-xl bg-[#0F2962] hover:bg-[#091a42] text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Ingest Document</span>
          </Link>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-200 space-y-3 bg-white shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tracking #, title, or uploader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F2962]"
            />
          </div>

          {/* Unit Filter (If Director or Admin) */}
          {isDirectorOrAdmin && (
            <div className="lg:col-span-2">
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2962]"
              >
                <option value="ALL">All Department Units</option>
                {units.map((u) => (
                  <option key={u.id} value={u.code}>
                    {u.code} - {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Doc Type Filter */}
          <div className={isDirectorOrAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2962]"
            >
              <option value="ALL">All Document Types</option>
              {documentTypes.map((dt) => (
                <option key={dt.id} value={dt.name}>
                  {dt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className={isDirectorOrAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2962]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_COORDINATOR">Pending Coordinator</option>
              <option value="PENDING_DIRECTOR">Pending Director</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED_RETURNED">Returned for Rework</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="lg:col-span-2 flex items-center justify-end gap-1">
            <button
              onClick={() => setOnlyEscalated(!onlyEscalated)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                onlyEscalated
                  ? "bg-red-600 text-white"
                  : "border border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Escalated</span>
            </button>

            <div className="border-l border-slate-200 pl-2 flex items-center gap-1">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === "table" ? "bg-[#0F2962] text-white" : "text-slate-500 hover:bg-slate-100"
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === "grid" ? "bg-[#0F2962] text-white" : "text-slate-500 hover:bg-slate-100"
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredDocuments.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 border border-slate-200 text-center space-y-3 bg-white">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No documents found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, status, or unit filters to view relevant records.
          </p>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-6">Tracking Number</th>
                  <th className="py-3.5 px-6">Title & Specifications</th>
                  <th className="py-3.5 px-6">Unit</th>
                  <th className="py-3.5 px-6">Uploader</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Created</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      {doc.trackingNumber}
                      {doc.currentVersion && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                          v{doc.currentVersion.versionNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-900 block truncate max-w-xs">
                        {doc.title}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {doc.documentType?.name || "General"}
                      </span>
                      {doc.isEscalated && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 mt-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Escalated (Rejections: {doc.rejectionCount})</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-bold font-mono">
                        {doc.unit?.code || "GEN"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {doc.uploader ? `${doc.uploader.firstName} ${doc.uploader.lastName}` : "Staff Member"}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusBadgeClass(doc.status)}`}>
                        {getStatusLabel(doc.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/dashboard/documents/${doc.id}`}
                        className="px-3 py-1 rounded-lg border border-slate-300 hover:bg-[#0F2962] hover:text-white hover:border-[#0F2962] text-slate-700 text-xs font-bold transition inline-block"
                      >
                        Open Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="glass-card rounded-2xl p-5 border border-slate-200 hover:shadow-md transition flex flex-col justify-between space-y-4 bg-white"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#0F2962] bg-blue-50 px-2 py-0.5 rounded">
                    {doc.trackingNumber}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      doc.status === DocumentStatus.APPROVED
                        ? "badge-approved"
                        : doc.status === DocumentStatus.REJECTED_RETURNED
                        ? "badge-returned"
                        : doc.status === DocumentStatus.PENDING_COORDINATOR ||
                          doc.status === DocumentStatus.PENDING_DIRECTOR
                        ? "badge-pending"
                        : "badge-draft"
                    }`}
                  >
                    {doc.status.replace("_", " ")}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{doc.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{doc.documentType?.name || "General"}</p>
                </div>

                {doc.isEscalated && (
                  <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Auto-Escalated to Director Oversight</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs space-y-3">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Unit: <strong className="text-slate-800 font-mono">{doc.unit?.code}</strong></span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <Link
                  href={`/dashboard/documents/${doc.id}`}
                  className="w-full py-2 rounded-xl bg-[#0F2962] hover:bg-[#091a42] text-white text-xs font-bold text-center block shadow-sm transition"
                >
                  Live View & Review
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
