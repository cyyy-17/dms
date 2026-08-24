"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignDelegationAction, revokeDelegationAction } from "@/actions/admin";
import {
  FileCheck2,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  UserCheck,
  Calendar,
} from "lucide-react";
import { getRoleLabel, formatHumanDate } from "@/lib/status-labels";

interface DelegationItem {
  id: string;
  delegatorId: string;
  delegateId: string;
  unitId: string;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  isActive: boolean;
  createdAt: Date;
  delegator: { firstName: string; lastName: string; role: string };
  delegate: { firstName: string; lastName: string; email: string; role: string };
  unit: { code: string; name: string };
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  unitId: string | null;
}

interface UnitOption {
  id: string;
  code: string;
  name: string;
}

export default function AdminDelegationManagement({
  delegations,
  users,
  units,
}: {
  delegations: DelegationItem[];
  users: UserOption[];
  units: UnitOption[];
}) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [revokingDelegation, setRevokingDelegation] = useState<DelegationItem | null>(null);
  const [revokeReason, setRevokeReason] = useState("");

  const coordinatorsAndDirectors = users.filter(
    (u) => u.role === "COORDINATOR" || u.role === "DIRECTOR" || u.role === "ADMIN"
  );
  const allEligibleStaff = users.filter((u) => u.role === "STAFF" || u.role === "COORDINATOR");

  const [form, setForm] = useState({
    delegatorId: coordinatorsAndDirectors[0]?.id || "",
    delegateId: allEligibleStaff[0]?.id || "",
    unitId: units[0]?.id || "",
    startDate: "2026-08-24",
    endDate: "2026-09-07",
    reason: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const filteredDelegations = delegations.filter((d) => {
    const matchesSearch =
      `${d.delegator.firstName} ${d.delegator.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${d.delegate.firstName} ${d.delegate.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.unit.code.toLowerCase().includes(searchQuery.toLowerCase());

    const isCurrentlyActive = d.isActive && new Date(d.endDate) >= new Date();
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && isCurrentlyActive) ||
      (statusFilter === "REVOKED" && !d.isActive) ||
      (statusFilter === "EXPIRED" && d.isActive && new Date(d.endDate) < new Date());

    return matchesSearch && matchesStatus;
  });

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    const res = await assignDelegationAction({
      delegatorId: form.delegatorId,
      delegateId: form.delegateId,
      unitId: form.unitId,
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
      reason: form.reason,
    });

    setIsLoading(false);
    if (res.success) {
      setFeedback({ type: "success", message: "Acting signatory delegation assigned successfully." });
      setIsAssignModalOpen(false);
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to assign delegation." });
    }
  };

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokingDelegation) return;
    setIsLoading(true);
    setFeedback(null);

    const res = await revokeDelegationAction(revokingDelegation.id, revokeReason || "Administrative revocation");
    setIsLoading(false);
    if (res.success) {
      setFeedback({ type: "success", message: "Delegation revoked successfully." });
      setRevokingDelegation(null);
      setRevokeReason("");
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to revoke delegation." });
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
              placeholder="Search by Delegator, Delegate, or Unit..."
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
            <option value="ALL">All Delegations</option>
            <option value="ACTIVE">Active Window</option>
            <option value="EXPIRED">Expired Window</option>
            <option value="REVOKED">Revoked</option>
          </select>
        </div>

        <button
          onClick={() => setIsAssignModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-[#0F2962] hover:bg-[#091a42] text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Assign Acting Signatory</span>
        </button>
      </div>

      {/* Delegations Table */}
      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-6">Delegator (Authority)</th>
                <th className="py-3.5 px-6">Appointed Delegate</th>
                <th className="py-3.5 px-6">Covered Unit</th>
                <th className="py-3.5 px-6">Delegation Window</th>
                <th className="py-3.5 px-6">Reason / Justification</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredDelegations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No active or historical signatory delegations recorded.
                  </td>
                </tr>
              ) : (
                filteredDelegations.map((d) => {
                  const isCurrent = d.isActive && new Date(d.endDate) >= new Date();
                  const isPast = new Date(d.endDate) < new Date();

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-900 block">
                          {d.delegator.firstName} {d.delegator.lastName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          {d.delegator.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>
                            {d.delegate.firstName} {d.delegate.lastName}
                          </span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">{d.delegate.email}</span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-700">
                        {d.unit.code} ({d.unit.name})
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1 font-medium text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {formatHumanDate(d.startDate)} – {formatHumanDate(d.endDate)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                        {d.reason || <span className="text-slate-400 italic">Official administrative leave</span>}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            !d.isActive
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : isCurrent
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : isPast
                              ? "bg-slate-100 text-slate-600 border border-slate-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {!d.isActive ? "Revoked" : isCurrent ? "Active Delegation" : "Expired"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {d.isActive && isCurrent && (
                          <button
                            onClick={() => setRevokingDelegation(d)}
                            disabled={isLoading}
                            className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-[11px] transition"
                          >
                            Revoke Delegation
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Assign Delegation */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#0F2962]" />
                <span>Assign Acting Signatory / Delegate</span>
              </h2>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssign} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">
                  Delegator (Coordinator or Director)
                </label>
                <select
                  value={form.delegatorId}
                  onChange={(e) => setForm({ ...form, delegatorId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {coordinatorsAndDirectors.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({getRoleLabel(u.role)}) – {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">
                  Appointed Delegate (Acting Signatory)
                </label>
                <select
                  value={form.delegateId}
                  onChange={(e) => setForm({ ...form, delegateId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {allEligibleStaff.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({getRoleLabel(u.role)}) – {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">Target Department Unit</label>
                <select
                  value={form.unitId}
                  onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 uppercase mb-1 block">Start Date</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 uppercase mb-1 block">End Date</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">Reason / Official Order</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Official Leave / OIC designated under Special Order No. 2026-44"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-[#0F2962] hover:bg-[#091a42] text-white font-semibold"
                >
                  {isLoading ? "Assigning..." : "Confirm Delegation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Revoke Delegation */}
      {revokingDelegation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-red-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span>Revoke Delegation</span>
              </h2>
              <button onClick={() => setRevokingDelegation(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Revoking acting signatory authority for{" "}
              <strong>
                {revokingDelegation.delegate.firstName} {revokingDelegation.delegate.lastName}
              </strong>{" "}
              on unit <strong>{revokingDelegation.unit.code}</strong>.
            </p>

            <form onSubmit={handleRevoke} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">Revocation Reason</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Delegator returned early from official business"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRevokingDelegation(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  {isLoading ? "Revoking..." : "Confirm Revocation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
