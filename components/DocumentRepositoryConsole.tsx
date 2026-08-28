"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getStatusLabel, getStatusBadgeClass, formatHumanDate } from "@/lib/status-labels";
import CopyTrackingButton from "@/components/CopyTrackingButton";
import DataTableWrapper from "@/components/DataTableWrapper";
import { useStarredDocuments } from "@/hooks/useStarredDocuments";
import ExpiryCalendarView from "@/components/ExpiryCalendarView";
import DocumentQuickPreviewModal, { QuickPreviewDoc } from "@/components/DocumentQuickPreviewModal";
import {
  FileText,
  Search,
  Plus,
  AlertTriangle,
  Calendar,
  LayoutGrid,
  List,
  Download,
  X,
  Star,
  Eye,
  CheckSquare,
  Square,
  Copy,
  Check,
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

function getStatusProgress(status: string): { percent: number; label: string; color: string } {
  switch (status) {
    case "APPROVED":
    case "ARCHIVED":
      return { percent: 100, label: "100% Sealed", color: "bg-emerald-500" };
    case "PENDING_DIRECTOR":
      return { percent: 75, label: "75% Stage 2", color: "bg-blue-600" };
    case "PENDING_COORDINATOR":
      return { percent: 50, label: "50% Stage 1", color: "bg-blue-500" };
    case "REJECTED_RETURNED":
      return { percent: 35, label: "35% Rework", color: "bg-amber-500" };
    case "REJECTED_CLOSED":
      return { percent: 100, label: "Closed", color: "bg-rose-500" };
    default:
      return { percent: 25, label: "25% Ingestion", color: "bg-slate-400" };
  }
}

export default function DocumentRepositoryConsole({
  initialDocuments,
  units,
  documentTypes,
  isDirectorOrAdmin,
}: DocumentRepositoryConsoleProps) {
  const { isStarred, toggleStar, starredCount } = useStarredDocuments();
  const [viewMode, setViewMode] = useState<"table" | "grid" | "calendar">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL");
  const [selectedDocType, setSelectedDocType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [onlyEscalated, setOnlyEscalated] = useState(false);
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<QuickPreviewDoc | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [copiedBatch, setCopiedBatch] = useState(false);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedUnit !== "ALL" ||
    selectedDocType !== "ALL" ||
    selectedStatus !== "ALL" ||
    onlyEscalated ||
    onlyStarred;

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedUnit("ALL");
    setSelectedDocType("ALL");
    setSelectedStatus("ALL");
    setOnlyEscalated(false);
    setOnlyStarred(false);
  };

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return initialDocuments.filter((doc) => {
      // Starred filter
      if (onlyStarred && !isStarred(doc.id)) {
        return false;
      }

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
  }, [initialDocuments, searchQuery, selectedUnit, selectedDocType, selectedStatus, onlyEscalated, onlyStarred, isStarred]);

  const toggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedDocIds.size === filteredDocuments.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(filteredDocuments.map((d) => d.id)));
    }
  };

  const handleExportSelectedCsv = () => {
    const selected = filteredDocuments.filter((d) => selectedDocIds.has(d.id));
    if (selected.length === 0) return;
    const headers = ["Tracking Number", "Title", "Unit", "Type", "Status", "Escalated", "Uploader", "Created At"];
    const rows = selected.map((d) => [
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
    link.setAttribute("download", `SASDMS_Selected_${selected.length}_Docs_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySelectedTrackingNumbers = () => {
    const selected = filteredDocuments.filter((d) => selectedDocIds.has(d.id));
    if (selected.length === 0) return;
    const text = selected.map((d) => d.trackingNumber).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedBatch(true);
    setTimeout(() => setCopiedBatch(false), 2000);
  };

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Document Repository
            </h1>
            <span className="px-3 py-0.5 rounded-full bg-blue-100/80 border border-blue-200 text-[#0F2962] text-xs font-black font-mono shadow-xs">
              {filteredDocuments.length} Records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Institutional document archive with cryptographic integrity and audit history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            onClick={handleExportCsv}
            className="px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-300/90 bg-white/90 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs hover:shadow-md transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5 active:scale-98 cursor-pointer"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <Link
            href="/dashboard/documents/new"
            className="px-4 sm:px-4.5 py-2.5 rounded-xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white text-xs font-bold shadow-lg shadow-blue-950/20 hover:shadow-xl transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5 active:scale-98"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>New Submission</span>
          </Link>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-white/90 shadow-sm space-y-3.5">
        {/* Tier 1: Search Input (Full Width on left) + View Controls / Actions (on right) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tracking #, title, or staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white border border-slate-300/90 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F2962] focus:border-[#0F2962] transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setOnlyStarred(!onlyStarred)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap ${
                onlyStarred
                  ? "bg-amber-500 text-slate-950 font-black shadow-amber-500/30"
                  : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
              title="Filter to your starred / pinned documents"
            >
              <Star className={`w-3.5 h-3.5 ${onlyStarred ? "fill-slate-950 text-slate-950" : "text-amber-500"}`} />
              <span>Starred</span>
              {starredCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  onlyStarred ? "bg-slate-950 text-amber-400" : "bg-amber-100 text-amber-900"
                }`}>
                  {starredCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setOnlyEscalated(!onlyEscalated)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap ${
                onlyEscalated
                  ? "bg-red-600 text-white shadow-red-500/30"
                  : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Escalated</span>
            </button>

            <div className="border-l border-slate-200 pl-2.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  viewMode === "table" ? "bg-[#0F2962] text-white shadow-xs" : "text-slate-500 hover:bg-slate-100 bg-white border border-slate-200"
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  viewMode === "grid" ? "bg-[#0F2962] text-white shadow-xs" : "text-slate-500 hover:bg-slate-100 bg-white border border-slate-200"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  viewMode === "calendar" ? "bg-[#0F2962] text-white shadow-xs" : "text-slate-500 hover:bg-slate-100 bg-white border border-slate-200"
                }`}
                title="Expiry Calendar View"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tier 2: Category Filter Selects (Equal Grid spanning full width) */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isDirectorOrAdmin ? "lg:grid-cols-3" : "lg:grid-cols-2"} gap-3 pt-2.5 border-t border-slate-100/90`}>
          {isDirectorOrAdmin && (
            <div className="relative">
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300/90 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0F2962] transition-all shadow-inner"
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

          <div className="relative">
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300/90 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0F2962] transition-all shadow-inner"
            >
              <option value="ALL">All Classification Types</option>
              {documentTypes.map((dt) => (
                <option key={dt.id} value={dt.name}>
                  {dt.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300/90 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0F2962] transition-all shadow-inner"
            >
              <option value="ALL">All Lifecycle Statuses</option>
              <option value="PENDING_COORDINATOR">Pending Coordinator</option>
              <option value="PENDING_DIRECTOR">Pending Director</option>
              <option value="APPROVED">Approved & Sealed</option>
              <option value="REJECTED_RETURNED">Returned for Rework</option>
              <option value="ARCHIVED">Archived Vault</option>
            </select>
          </div>
        </div>

        {/* Filter Reset pill when filters are active */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">
              Showing filtered results ({filteredDocuments.length} of {initialDocuments.length})
            </span>
            <button
              onClick={handleResetFilters}
              className="text-blue-700 hover:text-blue-900 font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Active Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {filteredDocuments.length === 0 ? (
        <div className="glass-panel rounded-3xl p-14 border border-white/90 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800">No matching documents found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium mt-1">
              Try adjusting your search criteria or clear your active filters to view repository records.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-[#0F2962] text-white font-bold text-xs shadow-sm hover:bg-[#091a42] transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === "calendar" ? (
        <ExpiryCalendarView documents={filteredDocuments} />
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="glass-panel rounded-3xl border border-white/90 overflow-hidden shadow-sm">
          <DataTableWrapper>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3.5 pl-4 pr-2 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="p-1 rounded hover:bg-slate-200 transition cursor-pointer text-slate-600"
                      title={selectedDocIds.size === filteredDocuments.length ? "Deselect All" : "Select All"}
                    >
                      {selectedDocIds.size === filteredDocuments.length && filteredDocuments.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-[#0F2962]" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">Tracking Number</th>
                  <th className="py-3.5 px-6">Title & Type</th>
                  <th className="py-3.5 px-6">Unit</th>
                  <th className="py-3.5 px-6">Uploader</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Created</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90 bg-white/60">
                {filteredDocuments.map((doc) => {
                  const starred = isStarred(doc.id);
                  const isSelected = selectedDocIds.has(doc.id);
                  return (
                    <tr
                      key={doc.id}
                      className={`transition-colors duration-150 ${
                        isSelected ? "bg-blue-50/80" : "hover:bg-blue-50/40"
                      }`}
                    >
                      <td className="py-4 pl-4 pr-2 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectDoc(doc.id)}
                          className="p-1 rounded hover:bg-slate-100 transition cursor-pointer text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#0F2962]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleStar(doc.id)}
                            className="p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer text-slate-400 hover:text-amber-500"
                            title={starred ? "Unpin document" : "Pin/Star document"}
                          >
                            <Star className={`w-3.5 h-3.5 ${starred ? "fill-amber-400 text-amber-500" : ""}`} />
                          </button>
                          <CopyTrackingButton trackingNumber={doc.trackingNumber} />
                          {doc.currentVersion && (
                            <span className="px-1.5 py-0.5 rounded-md bg-blue-100/80 text-blue-800 text-[10px] font-bold">
                              v{doc.currentVersion.versionNumber}
                            </span>
                          )}
                        </div>
                      </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 block truncate max-w-xs">
                        {doc.title}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium block">
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
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-black font-mono">
                        {doc.unit?.code || "GEN"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {doc.uploader ? `${doc.uploader.firstName} ${doc.uploader.lastName}` : "Staff Member"}
                    </td>
                    <td className="py-4 px-6">
                      {(() => {
                        const prog = getStatusProgress(doc.status);
                        return (
                          <div className="space-y-1.5 min-w-28">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(doc.status)}`}>
                              {getStatusLabel(doc.status)}
                            </span>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${prog.color} transition-all duration-300`}
                                style={{ width: `${prog.percent}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-mono text-slate-400 block">
                              {prog.label}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                      {formatHumanDate(doc.createdAt)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDoc({
                              id: doc.id,
                              trackingNumber: doc.trackingNumber,
                              title: doc.title,
                              status: doc.status,
                              createdAt: doc.createdAt,
                              expiryDate: doc.expiryDate,
                              unit: doc.unit || { code: "GEN", name: "General Administration" },
                              documentType: doc.documentType || { code: "DOC", name: "Standard Document" },
                              uploader: doc.uploader
                                ? { firstName: doc.uploader.firstName, lastName: doc.uploader.lastName, email: "" }
                                : { firstName: "Staff", lastName: "Member", email: "" },
                              currentVersion: doc.currentVersion
                                ? {
                                    versionNumber: doc.currentVersion.versionNumber,
                                    fileName: doc.currentVersion.fileName,
                                    sha256Checksum: "",
                                  }
                                : null,
                            })
                          }
                          className="p-1.5 rounded-xl border border-slate-200 hover:bg-blue-50 hover:text-[#0F2962] text-slate-500 transition cursor-pointer"
                          title="Quick Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          href={`/dashboard/documents/${doc.id}`}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-300/90 hover:bg-[#0F2962] hover:text-white hover:border-[#0F2962] text-slate-700 text-xs font-bold transition-all shadow-xs inline-block hover:-translate-y-0.5 active:scale-98"
                        >
                          Open
                        </Link>
                      </div>
                    </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </DataTableWrapper>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocuments.map((doc) => {
            const prog = getStatusProgress(doc.status);
            return (
              <div
                key={doc.id}
                className={`glass-panel glass-panel-interactive rounded-3xl p-6 border transition flex flex-col justify-between space-y-4 bg-white/85 ${
                  doc.isEscalated ? "border-red-300 bg-red-50/20" : "border-white/90"
                }`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleStar(doc.id)}
                        className="p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer text-slate-400 hover:text-amber-500"
                        title={isStarred(doc.id) ? "Unpin document" : "Pin/Star document"}
                      >
                        <Star className={`w-3.5 h-3.5 ${isStarred(doc.id) ? "fill-amber-400 text-amber-500" : ""}`} />
                      </button>
                      <CopyTrackingButton trackingNumber={doc.trackingNumber} />
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(doc.status)}`}>
                      {getStatusLabel(doc.status)}
                    </span>
                  </div>

                  {/* Card Pipeline Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Pipeline Progress</span>
                      <span className="font-bold">{prog.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${prog.color} transition-all duration-300`}
                        style={{ width: `${prog.percent}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">{doc.title}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">{doc.documentType?.name || "General"}</p>
                  </div>

                {doc.isEscalated && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Auto-Escalated (Rejections: {doc.rejectionCount})</span>
                  </div>
                )}
              </div>

              <div className="pt-3.5 border-t border-slate-100 text-xs space-y-3.5">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Unit: <strong className="text-slate-800 font-mono font-bold">{doc.unit?.code}</strong></span>
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {formatHumanDate(doc.createdAt)}
                  </span>
                </div>

                <Link
                  href={`/dashboard/documents/${doc.id}`}
                  className="w-full py-2.5 rounded-xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white text-xs font-bold text-center block shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-98"
                >
                  Live View & Review
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    )}
      {/* Floating Batch Selection Command Deck */}
      {selectedDocIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-xl flex items-center gap-3.5 text-xs animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#0F2962] text-amber-400 font-black flex items-center justify-center text-[10px]">
              {selectedDocIds.size}
            </span>
            <span className="font-bold">Selected</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <button
            type="button"
            onClick={handleExportSelectedCsv}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleCopySelectedTrackingNumbers}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            {copiedBatch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copiedBatch ? "Copied!" : "Copy IDs"}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedDocIds(new Set())}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer ml-1"
            title="Clear Selection"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick Preview Modal */}
      <DocumentQuickPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />
    </div>
  );
}
