"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminOverrideDocumentStatusAction, adminArchiveDocumentAction } from "@/actions/admin";
import {
  ShieldAlert,
  Search,
  Archive,
  CheckCircle,
  AlertCircle,
  X,
  ExternalLink,
  Wrench,
} from "lucide-react";
import { DocumentStatus, ApprovalLevel } from "@prisma/client";

interface DocumentWithDetails {
  id: string;
  trackingNumber: string;
  title: string;
  status: DocumentStatus;
  approvalLevel: ApprovalLevel;
  isEscalated: boolean;
  rejectionCount: number;
  createdAt: Date;
  updatedAt: Date;
  unit: { code: string; name: string };
  uploader: { firstName: string; lastName: string; email: string };
  documentType: { code: string; name: string };
  currentVersion?: { versionNumber: number; fileName: string } | null;
}

export default function AdminDocumentOverrideManagement({
  documents,
}: {
  documents: DocumentWithDetails[];
}) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [unitFilter, setUnitFilter] = useState("ALL");

  const [overrideDoc, setOverrideDoc] = useState<DocumentWithDetails | null>(null);
  const [archiveDoc, setArchiveDoc] = useState<DocumentWithDetails | null>(null);

  const [overrideForm, setOverrideForm] = useState<{
    targetStatus: DocumentStatus;
    approvalLevel: ApprovalLevel;
    reason: string;
  }>({
    targetStatus: DocumentStatus.APPROVED,
    approvalLevel: ApprovalLevel.DIRECTOR_REQUIRED,
    reason: "",
  });

  const [archiveReason, setArchiveReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const uniqueUnits = Array.from(new Set(documents.map((d) => d.unit.code)));

  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${d.uploader.firstName} ${d.uploader.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
    const matchesUnit = unitFilter === "ALL" || d.unit.code === unitFilter;

    return matchesSearch && matchesStatus && matchesUnit;
  });

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideDoc) return;
    setIsLoading(true);
    setFeedback(null);

    const res = await adminOverrideDocumentStatusAction({
      documentId: overrideDoc.id,
      targetStatus: overrideForm.targetStatus,
      approvalLevel: overrideForm.approvalLevel,
      reason: overrideForm.reason,
    });

    setIsLoading(false);
    if (res.success) {
      setFeedback({
        type: "success",
        message: `Status of '${overrideDoc.trackingNumber}' overridden to ${overrideForm.targetStatus}.`,
      });
      setOverrideDoc(null);
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to override document status." });
    }
  };

  const handleArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archiveDoc) return;
    setIsLoading(true);
    setFeedback(null);

    const res = await adminArchiveDocumentAction({
      documentId: archiveDoc.id,
      disposalReason: archiveReason,
    });

    setIsLoading(false);
    if (res.success) {
      setFeedback({
        type: "success",
        message: `Document '${archiveDoc.trackingNumber}' archived under RA 10173 compliance ledger.`,
      });
      setArchiveDoc(null);
      setArchiveReason("");
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to archive document." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
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

      {/* Filter Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Tracking #, Title, or Uploader..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
          />
        </div>

        <select
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          className="text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
        >
          <option value="ALL">All Units</option>
          {uniqueUnits.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
        >
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="PENDING_COORDINATOR">PENDING COORDINATOR</option>
          <option value="PENDING_DIRECTOR">PENDING DIRECTOR</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED_RETURNED">REJECTED RETURNED</option>
          <option value="REJECTED_CLOSED">REJECTED CLOSED</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
      </div>

      {/* Override Table */}
      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-6">Tracking Number</th>
                <th className="py-3.5 px-6">Title & Version</th>
                <th className="py-3.5 px-6">Unit</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Required Level</th>
                <th className="py-3.5 px-6">Rejection & Escalation</th>
                <th className="py-3.5 px-6 text-right">Admin Interventions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No documents found.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{doc.trackingNumber}</span>
                        <Link
                          href={`/dashboard/documents/${doc.id}`}
                          title="Open Document Inspector"
                          className="text-slate-400 hover:text-[#0F2962]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-900 block truncate max-w-xs">
                        {doc.title}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        v{doc.currentVersion?.versionNumber || 1} • {doc.documentType.name}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-700">{doc.unit.code}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          doc.status === DocumentStatus.APPROVED
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : doc.status === DocumentStatus.ARCHIVED
                            ? "bg-slate-100 text-slate-600 border border-slate-200"
                            : doc.status === DocumentStatus.REJECTED_RETURNED ||
                              doc.status === DocumentStatus.REJECTED_CLOSED
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {doc.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-mono text-[11px]">
                      {doc.approvalLevel}
                    </td>
                    <td className="py-4 px-6">
                      {doc.isEscalated ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Escalated ({doc.rejectionCount}x)</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          Rejections: {doc.rejectionCount}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-1.5">
                      <button
                        title="Emergency State Override"
                        onClick={() => {
                          setOverrideDoc(doc);
                          setOverrideForm({
                            targetStatus: doc.status,
                            approvalLevel: doc.approvalLevel,
                            reason: "",
                          });
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition inline-flex items-center gap-1"
                      >
                        <Wrench className="w-3.5 h-3.5 text-blue-600" />
                        <span>Override</span>
                      </button>

                      {doc.status !== DocumentStatus.ARCHIVED && (
                        <button
                          title="Archive under RA 10173"
                          onClick={() => setArchiveDoc(doc)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition inline-flex items-center gap-1"
                        >
                          <Archive className="w-3.5 h-3.5 text-amber-700" />
                          <span>Archive</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Override Status */}
      {overrideDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" />
                <span>Admin Document State Override</span>
              </h2>
              <button onClick={() => setOverrideDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Intervening on tracking number <strong>{overrideDoc.trackingNumber}</strong> (Current status:{" "}
              <strong>{overrideDoc.status}</strong>).
            </p>

            <form onSubmit={handleOverride} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">Target Status</label>
                <select
                  value={overrideForm.targetStatus}
                  onChange={(e) =>
                    setOverrideForm({ ...overrideForm, targetStatus: e.target.value as DocumentStatus })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PENDING_COORDINATOR">PENDING_COORDINATOR</option>
                  <option value="PENDING_DIRECTOR">PENDING_DIRECTOR</option>
                  <option value="APPROVED">APPROVED (Force Grant)</option>
                  <option value="REJECTED_RETURNED">REJECTED_RETURNED (Force Return)</option>
                  <option value="REJECTED_CLOSED">REJECTED_CLOSED (Terminate Dead-End)</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">Approval Chain Scope</label>
                <select
                  value={overrideForm.approvalLevel}
                  onChange={(e) =>
                    setOverrideForm({ ...overrideForm, approvalLevel: e.target.value as ApprovalLevel })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="COORDINATOR_ONLY">COORDINATOR_ONLY</option>
                  <option value="DIRECTOR_REQUIRED">DIRECTOR_REQUIRED</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">
                  Mandatory Administrative Justification (Logged into Audit Trail)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why this status was overridden administratively..."
                  value={overrideForm.reason}
                  onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOverrideDoc(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-[#0F2962] hover:bg-[#091a42] text-white font-semibold"
                >
                  {isLoading ? "Executing..." : "Apply State Override"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Archive Document */}
      {archiveDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-amber-900 flex items-center gap-2">
                <Archive className="w-5 h-5 text-amber-700" />
                <span>RA 10173 Compliance Archival</span>
              </h2>
              <button onClick={() => setArchiveDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Archiving document <strong>{archiveDoc.trackingNumber}</strong>. The record will remain
              preserved immutably in the compliance ledger.
            </p>

            <form onSubmit={handleArchive} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">
                  Disposal / Archival Reason
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Contract completed and statutory 5-year retention cycle fulfilled."
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setArchiveDoc(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold"
                >
                  {isLoading ? "Archiving..." : "Confirm Archival"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
