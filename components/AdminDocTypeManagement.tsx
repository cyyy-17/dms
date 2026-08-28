"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createDocumentTypeAction,
  updateDocumentTypeAction,
  toggleDocumentTypeStatusAction,
} from "@/actions/admin";
import { uploadDocTypeTemplateAction } from "@/actions/templates";
import {
  FileCode2,
  Plus,
  Edit2,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  ShieldCheck,
  Calendar,
  FileUp,
} from "lucide-react";
import DataTableWrapper from "@/components/DataTableWrapper";
import { ApprovalLevel } from "@prisma/client";

interface DocTypeItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  defaultApprovalLevel?: ApprovalLevel;
  requiresExpiryTracking: boolean;
  defaultRetentionDays: number;
  isActive: boolean;
  _count?: {
    documents: number;
  };
}

export default function AdminDocTypeManagement({ docTypes }: { docTypes: DocTypeItem[] }) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<DocTypeItem | null>(null);

  const [form, setForm] = useState<{
    code: string;
    name: string;
    description: string;
    defaultApprovalLevel: ApprovalLevel;
    requiresExpiryTracking: boolean;
    defaultRetentionDays: number;
    isActive: boolean;
  }>({
    code: "",
    name: "",
    description: "",
    defaultApprovalLevel: ApprovalLevel.COORDINATOR_ONLY,
    requiresExpiryTracking: false,
    defaultRetentionDays: 1825,
    isActive: true,
  });

  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const filteredTypes = docTypes.filter((dt) => {
    const matchesSearch =
      dt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dt.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dt.description && dt.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" || (statusFilter === "ACTIVE" ? dt.isActive : !dt.isActive);

    return matchesSearch && matchesStatus;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    const res = await createDocumentTypeAction({
      code: form.code,
      name: form.name,
      description: form.description,
      defaultApprovalLevel: form.defaultApprovalLevel,
      requiresExpiryTracking: form.requiresExpiryTracking,
      defaultRetentionDays: Number(form.defaultRetentionDays),
      isActive: form.isActive,
    });

    if (res.success) {
      if (templateFile) {
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(templateFile);
          });
          await uploadDocTypeTemplateAction(form.code, base64, templateFile.name);
        } catch {
          console.error("Template upload failed");
        }
      }

      setFeedback({ type: "success", message: `Document type '${form.code}' created successfully.` });
      setIsCreateModalOpen(false);
      setTemplateFile(null);
      setForm({
        code: "",
        name: "",
        description: "",
        defaultApprovalLevel: ApprovalLevel.COORDINATOR_ONLY,
        requiresExpiryTracking: false,
        defaultRetentionDays: 1825,
        isActive: true,
      });
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to create document type." });
    }
    setIsLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;
    setIsLoading(true);
    setFeedback(null);

    const res = await updateDocumentTypeAction({
      id: editingType.id,
      code: form.code,
      name: form.name,
      description: form.description,
      defaultApprovalLevel: form.defaultApprovalLevel,
      requiresExpiryTracking: form.requiresExpiryTracking,
      defaultRetentionDays: Number(form.defaultRetentionDays),
      isActive: form.isActive,
    });

    if (res.success) {
      if (templateFile) {
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(templateFile);
          });
          await uploadDocTypeTemplateAction(form.code, base64, templateFile.name);
        } catch {
          console.error("Template upload failed");
        }
      }

      setFeedback({ type: "success", message: `Document type '${form.code}' updated successfully.` });
      setEditingType(null);
      setTemplateFile(null);
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to update document type." });
    }
    setIsLoading(false);
  };

  const handleToggleStatus = async (docType: DocTypeItem) => {
    setIsLoading(true);
    const nextStatus = !docType.isActive;
    const res = await toggleDocumentTypeStatusAction(docType.id, nextStatus);
    setIsLoading(false);
    if (res.success) {
      setFeedback({
        type: "success",
        message: `Type '${docType.code}' is now ${nextStatus ? "Active" : "Inactive"}.`,
      });
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to toggle status." });
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

      {/* Filter / Action Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-56 flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Classification Code or Title..."
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
            <option value="ACTIVE">Active Types</option>
            <option value="INACTIVE">Inactive Types</option>
          </select>
        </div>

        <button
          onClick={() => {
            setForm({
              code: "",
              name: "",
              description: "",
              defaultApprovalLevel: ApprovalLevel.COORDINATOR_ONLY,
              requiresExpiryTracking: false,
              defaultRetentionDays: 365,
              isActive: true,
            });
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2 rounded-lg bg-[#0F2962] hover:bg-[#091a42] text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Add Classification Type</span>
        </button>
      </div>

      {/* Document Types Table */}
      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <DataTableWrapper>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-6">Classification Code</th>
                <th className="py-3.5 px-6">Document Type Name</th>
                <th className="py-3.5 px-6">RA 10173 Retention</th>
                <th className="py-3.5 px-6">Expiry Tracking</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredTypes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No document classification types found.
                  </td>
                </tr>
              ) : (
                filteredTypes.map((dt) => (
                  <tr key={dt.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">{dt.code}</td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 block">{dt.name}</span>
                      {dt.description && <span className="text-[11px] text-slate-500 line-clamp-1">{dt.description}</span>}
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-700">
                      <span className="inline-flex items-center gap-1 font-bold text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{dt.defaultRetentionDays} days ({Math.round(dt.defaultRetentionDays / 365)} yr)</span>
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {dt.requiresExpiryTracking ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Calendar className="w-3 h-3" />
                          <span>Required (30d alert)</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Not required</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          dt.isActive
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {dt.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        title="Edit Type"
                        onClick={() => {
                          setEditingType(dt);
                          setForm({
                            code: dt.code,
                            name: dt.name,
                            description: dt.description || "",
                            defaultApprovalLevel: dt.defaultApprovalLevel || ApprovalLevel.COORDINATOR_ONLY,
                            requiresExpiryTracking: dt.requiresExpiryTracking,
                            defaultRetentionDays: dt.defaultRetentionDays,
                            isActive: dt.isActive,
                          });
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(dt)}
                        disabled={isLoading}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition border ${
                          dt.isActive
                            ? "border-slate-300 text-slate-600 hover:bg-slate-100"
                            : "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        }`}
                      >
                        {dt.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableWrapper>
      </div>

      {/* Modal: Create or Edit Document Type */}
      {(isCreateModalOpen || editingType) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-[#0F2962]" />
                <span>{editingType ? "Edit Document Type" : "Create Classification Type"}</span>
              </h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingType(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingType ? handleUpdate : handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">Classification Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MOU_MOA, EVENT_PERMIT"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">Document Type Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Memorandum of Agreement / Understanding"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">Description & Scope</label>
                <textarea
                  rows={2}
                  placeholder="Purpose, validity criteria, and required context..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 uppercase mb-1 block">
                    RA 10173 Retention (Days)
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={18250}
                    required
                    value={form.defaultRetentionDays}
                    onChange={(e) => setForm({ ...form, defaultRetentionDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    e.g. 365 = 1 year, 1825 = 5 years, 3650 = 10 years
                  </span>
                </div>
                <div className="flex flex-col justify-center space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="requiresExpiry"
                      checked={form.requiresExpiryTracking}
                      onChange={(e) => setForm({ ...form, requiresExpiryTracking: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0F2962]"
                    />
                    <label htmlFor="requiresExpiry" className="font-semibold text-slate-800">
                      Requires Expiry Date Tracking
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActiveDocType"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0F2962]"
                    />
                    <label htmlFor="isActiveDocType" className="font-semibold text-slate-800">
                      Classification Type is Active
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                  <FileUp className="w-3.5 h-3.5 text-blue-600" />
                  <span>Official Blank Template PDF (Optional)</span>
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#0F2962] hover:file:bg-blue-100 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Staff can download this official template directly from the document creation wizard.
                </span>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingType(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-[#0F2962] hover:bg-[#091a42] text-white font-semibold"
                >
                  {isLoading ? "Saving..." : editingType ? "Save Changes" : "Create Type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
