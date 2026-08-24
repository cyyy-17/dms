"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUnitAction, updateUnitAction, toggleUnitStatusAction } from "@/actions/admin";
import {
  Building2,
  Plus,
  Edit2,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  Users,
} from "lucide-react";

interface UnitWithStats {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: {
    users: number;
    documents: number;
  };
}

export default function AdminUnitManagement({ units }: { units: UnitWithStats[] }) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitWithStats | null>(null);

  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    isActive: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const filteredUnits = units.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.description && u.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" || (statusFilter === "ACTIVE" ? u.isActive : !u.isActive);

    return matchesSearch && matchesStatus;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    const res = await createUnitAction({
      code: form.code,
      name: form.name,
      description: form.description,
      isActive: form.isActive,
    });

    setIsLoading(false);
    if (res.success) {
      setFeedback({ type: "success", message: `Unit '${form.code}' created successfully.` });
      setIsCreateModalOpen(false);
      setForm({ code: "", name: "", description: "", isActive: true });
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to create unit." });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;
    setIsLoading(true);
    setFeedback(null);

    const res = await updateUnitAction({
      id: editingUnit.id,
      code: form.code,
      name: form.name,
      description: form.description,
      isActive: form.isActive,
    });

    setIsLoading(false);
    if (res.success) {
      setFeedback({ type: "success", message: `Unit '${form.code}' updated successfully.` });
      setEditingUnit(null);
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to update unit." });
    }
  };

  const handleToggleStatus = async (unit: UnitWithStats) => {
    setIsLoading(true);
    const nextStatus = !unit.isActive;
    const res = await toggleUnitStatusAction(unit.id, nextStatus);
    setIsLoading(false);
    if (res.success) {
      setFeedback({
        type: "success",
        message: `Unit '${unit.code}' is now ${nextStatus ? "Active" : "Inactive"}.`,
      });
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to toggle unit status." });
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

      {/* Filter / Action Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-56 flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Unit Code or Name..."
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
            <option value="ACTIVE">Active Units</option>
            <option value="INACTIVE">Inactive Units</option>
          </select>
        </div>

        <button
          onClick={() => {
            setForm({ code: "", name: "", description: "", isActive: true });
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2 rounded-lg bg-[#0F2962] hover:bg-[#091a42] text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Create Department Unit</span>
        </button>
      </div>

      {/* Units Grid / Table */}
      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-6">Unit Code</th>
                <th className="py-3.5 px-6">Department Unit Name</th>
                <th className="py-3.5 px-6">Description & Scope</th>
                <th className="py-3.5 px-6">Headcount</th>
                <th className="py-3.5 px-6">Documents</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No department units found.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900 text-sm">
                      {u.code}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {u.name}
                    </td>
                    <td className="py-4 px-6 text-slate-600 max-w-xs">
                      {u.description || <span className="text-slate-300 italic">No description provided</span>}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded">
                        <Users className="w-3 h-3 text-slate-500" />
                        <span>{u._count?.users ?? 0}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded">
                        <FileText className="w-3 h-3 text-slate-500" />
                        <span>{u._count?.documents ?? 0}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {u.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        title="Edit Unit"
                        onClick={() => {
                          setEditingUnit(u);
                          setForm({
                            code: u.code,
                            name: u.name,
                            description: u.description || "",
                            isActive: u.isActive,
                          });
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={isLoading}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition border ${
                          u.isActive
                            ? "border-slate-300 text-slate-600 hover:bg-slate-100"
                            : "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        }`}
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create or Edit Unit */}
      {(isCreateModalOpen || editingUnit) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0F2962]" />
                <span>{editingUnit ? "Edit Department Unit" : "Create New Unit"}</span>
              </h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingUnit(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingUnit ? handleUpdate : handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">Unit Code (e.g. CAREER, ALUMNI)</label>
                <input
                  type="text"
                  required
                  placeholder="CAREER"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">Department Unit Name</label>
                <input
                  type="text"
                  required
                  placeholder="Career Services & Placement"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">Description & Scope</label>
                <textarea
                  rows={3}
                  placeholder="Mandate, functions, and key workflows..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0F2962] focus:ring-[#0F2962]"
                />
                <label htmlFor="isActiveToggle" className="font-semibold text-slate-800">
                  Unit is Active and available for document ingestion
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingUnit(null);
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
                  {isLoading ? "Saving..." : editingUnit ? "Save Changes" : "Create Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
