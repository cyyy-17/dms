"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { assignDelegationAction, revokeDelegationAction } from "@/actions/admin";
import { batchRevokeExpiredDelegationsAction } from "@/actions/delegations";
import {
  FileCheck2,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  UserCheck,
  Calendar,
  Clock,
  ShieldAlert,
} from "lucide-react";
import DataTableWrapper from "@/components/DataTableWrapper";
import { getRoleLabel, formatHumanDate } from "@/lib/status-labels";

function subscribeToNow(callback: () => void) {
  const interval = setInterval(callback, 60000);
  return () => clearInterval(interval);
}

function getNowSnapshot() {
  return Date.now();
}

function getServerSnapshot() {
  return 0;
}

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
  const [assignStep, setAssignStep] = useState<1 | 2>(1);
  const [assignDirection, setAssignDirection] = useState<"forward" | "backward">("forward");
  const [revokingDelegation, setRevokingDelegation] = useState<DelegationItem | null>(null);
  const [revokeReason, setRevokeReason] = useState("");

  const coordinatorsAndDirectors = users.filter(
    (u) => u.role === "COORDINATOR" || u.role === "DIRECTOR" || u.role === "ADMIN"
  );
  const allEligibleStaff = users.filter((u) => u.role === "STAFF" || u.role === "COORDINATOR");

  const getInitialDates = () => {
    const today = new Date();
    const plus14 = new Date();
    plus14.setDate(today.getDate() + 14);
    return {
      startDate: today.toISOString().split("T")[0],
      endDate: plus14.toISOString().split("T")[0],
    };
  };

  const initialDates = getInitialDates();

  const [form, setForm] = useState({
    delegatorId: coordinatorsAndDirectors[0]?.id || "",
    delegateId: allEligibleStaff[0]?.id || "",
    unitId: units[0]?.id || "",
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
    reason: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const currentTime = useSyncExternalStore(subscribeToNow, getNowSnapshot, getServerSnapshot);

  const filteredDelegations = useMemo(() => {
    const nowDate = currentTime > 0 ? new Date(currentTime) : new Date(0);
    return delegations.filter((d) => {
      const matchesSearch =
        `${d.delegator.firstName} ${d.delegator.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${d.delegate.firstName} ${d.delegate.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.unit.code.toLowerCase().includes(searchQuery.toLowerCase());

      const isCurrentlyActive = d.isActive && (currentTime === 0 || new Date(d.endDate) >= nowDate);
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && isCurrentlyActive) ||
        (statusFilter === "REVOKED" && !d.isActive) ||
        (statusFilter === "EXPIRED" && d.isActive && currentTime > 0 && new Date(d.endDate) < nowDate);

      return matchesSearch && matchesStatus;
    });
  }, [delegations, searchQuery, statusFilter, currentTime]);

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

  const handleBatchRevokeExpired = async () => {
    setIsLoading(true);
    setFeedback(null);

    const res = await batchRevokeExpiredDelegationsAction();
    setIsLoading(false);
    if (res.success) {
      setFeedback({
        type: "success",
        message: `Successfully revoked ${res.revokedCount} expired delegation(s).`,
      });
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to batch revoke expired delegations." });
    }
  };

  const { activeCount, expiring72hCount, expiredCount } = useMemo(() => {
    if (currentTime === 0) {
      return {
        activeCount: delegations.filter((d) => d.isActive).length,
        expiring72hCount: 0,
        expiredCount: 0,
      };
    }

    const nowDate = new Date(currentTime);
    let active = 0;
    let expiring = 0;
    let expired = 0;

    delegations.forEach((d) => {
      const end = new Date(d.endDate);
      if (d.isActive) {
        if (end >= nowDate) {
          active++;
          if (end.getTime() - currentTime <= 72 * 3600 * 1000) {
            expiring++;
          }
        } else {
          expired++;
        }
      }
    });

    return { activeCount: active, expiring72hCount: expiring, expiredCount: expired };
  }, [delegations, currentTime]);

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
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Active Delegations</span>
          </span>
          <p className="text-xl font-black text-slate-900 font-mono">{activeCount}</p>
          <span className="text-[10px] text-slate-500 font-medium block">Authorized acting signatories</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Expiring in &lt; 72 Hours</span>
          </span>
          <p className="text-xl font-black text-amber-900 font-mono">{expiring72hCount}</p>
          <span className="text-[10px] text-amber-700 font-bold block">72h auto-warning window</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Expired (Pending Cleanup)</span>
            </span>
            {expiredCount > 0 && (
              <button
                type="button"
                onClick={handleBatchRevokeExpired}
                disabled={isLoading}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 hover:bg-rose-200 text-rose-700 transition cursor-pointer"
              >
                Revoke All ({expiredCount})
              </button>
            )}
          </div>
          <p className="text-xl font-black text-rose-900 font-mono">{expiredCount}</p>
          <span className="text-[10px] text-slate-500 font-medium block">Past statutory validity date</span>
        </div>
      </div>

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
        <DataTableWrapper>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-3 sm:py-3.5 sm:px-6">Delegator (Principal)</th>
                <th className="py-3 px-3 sm:py-3.5 sm:px-6">Acting Delegate</th>
                <th className="hidden md:table-cell py-3 px-3 sm:py-3.5 sm:px-6">Assigned Unit</th>
                <th className="hidden sm:table-cell py-3 px-3 sm:py-3.5 sm:px-6">Validity Period</th>
                <th className="hidden lg:table-cell py-3 px-3 sm:py-3.5 sm:px-6">Reason</th>
                <th className="py-3 px-3 sm:py-3.5 sm:px-6">Status</th>
                <th className="py-3 px-3 sm:py-3.5 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredDelegations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 sm:px-6 text-center text-slate-400">
                    No active or historical signatory delegations recorded.
                  </td>
                </tr>
              ) : (
                filteredDelegations.map((d) => {
                  const isCurrent = d.isActive && new Date(d.endDate) >= new Date();
                  const isPast = new Date(d.endDate) < new Date();

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 sm:py-4 sm:px-6">
                        <span className="font-bold text-slate-900 block truncate max-w-32.5 xs:max-w-xs">
                          {d.delegator.firstName} {d.delegator.lastName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          {getRoleLabel(d.delegator.role)}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:py-4 sm:px-6">
                        <span className="font-bold text-slate-900 flex items-center gap-1 truncate max-w-32.5 xs:max-w-xs">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">
                            {d.delegate.firstName} {d.delegate.lastName}
                          </span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono block truncate max-w-32.5 xs:max-w-xs">{d.delegate.email}</span>
                      </td>
                      <td className="hidden md:table-cell py-3 px-3 sm:py-4 sm:px-6 font-semibold text-slate-700">
                        {d.unit.code} ({d.unit.name})
                      </td>
                      <td className="hidden sm:table-cell py-3 px-3 sm:py-4 sm:px-6">
                        <div className="flex items-center gap-1 font-medium text-slate-800 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {formatHumanDate(d.startDate)} – {formatHumanDate(d.endDate)}
                          </span>
                        </div>
                      </td>
                      <td className="hidden lg:table-cell py-3 px-3 sm:py-4 sm:px-6 text-slate-600 max-w-xs truncate">
                        {d.reason || <span className="text-slate-400 italic">Official administrative leave</span>}
                      </td>
                      <td className="py-3 px-3 sm:py-4 sm:px-6">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${
                            !d.isActive
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : isCurrent
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : isPast
                              ? "bg-slate-100 text-slate-600 border border-slate-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {!d.isActive ? "Revoked" : isCurrent ? "Active" : "Expired"}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:py-4 sm:px-6 text-right">
                        {d.isActive && isCurrent && (
                          <button
                            onClick={() => setRevokingDelegation(d)}
                            disabled={isLoading}
                            className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-[11px] transition cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </DataTableWrapper>
      </div>

      {/* Modal: Assign Delegation (Multi-Step Sliding Wizard) */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0F2962] flex items-center justify-center font-bold">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Assign Acting Signatory
                  </h2>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {assignStep === 1 ? "Step 1 of 2: Stakeholders & Unit" : "Step 2 of 2: Schedule & Purpose"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setAssignStep(1);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-500">
                <span className="uppercase tracking-wider">
                  {assignStep === 1 ? "1. Stakeholder Assignment" : "2. Validity Schedule"}
                </span>
                <span className="text-[#0F2962] font-mono">{assignStep === 1 ? "50%" : "100%"}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full rounded-full bg-linear-to-r from-[#0F2962] to-amber-400 transition-all duration-300"
                  style={{ width: `${assignStep === 1 ? 50 : 100}%` }}
                />
              </div>
            </div>

            {/* STEP 1: Stakeholders & Unit */}
            {assignStep === 1 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (form.delegatorId === form.delegateId) {
                    setFeedback({ type: "error", message: "Delegator and Appointed Delegate cannot be the same user." });
                    return;
                  }
                  setFeedback(null);
                  setAssignDirection("forward");
                  setAssignStep(2);
                }}
                key="assign-step-1"
                className={`space-y-3 text-xs animate-in fade-in ${
                  assignDirection === "forward" ? "slide-in-from-right-3" : "slide-in-from-left-3"
                } duration-200`}
              >
                <div>
                  <label className="font-bold text-slate-700 uppercase mb-1 block text-[10.5px]">
                    Delegator (Coordinator or Director) *
                  </label>
                  <select
                    value={form.delegatorId}
                    onChange={(e) => setForm({ ...form, delegatorId: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                  >
                    {coordinatorsAndDirectors.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({getRoleLabel(u.role)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase mb-1 block text-[10.5px]">
                    Appointed Delegate (Acting Signatory) *
                  </label>
                  <select
                    value={form.delegateId}
                    onChange={(e) => setForm({ ...form, delegateId: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                  >
                    {allEligibleStaff.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({getRoleLabel(u.role)}) – {u.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase mb-1 block text-[10.5px]">Target Department Unit *</label>
                  <select
                    value={form.unitId}
                    onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAssignModalOpen(false);
                      setAssignStep(1);
                    }}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#0F2962] hover:bg-[#091a42] text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Next: Schedule & Details</span>
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Schedule & Reason */}
            {assignStep === 2 && (
              <form
                onSubmit={handleAssign}
                key="assign-step-2"
                className={`space-y-3 text-xs animate-in fade-in ${
                  assignDirection === "forward" ? "slide-in-from-right-3" : "slide-in-from-left-3"
                } duration-200`}
              >
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 uppercase mb-1 block text-[10.5px]">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 uppercase mb-1 block text-[10.5px]">End Date *</label>
                    <input
                      type="date"
                      required
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase mb-1 block text-[10.5px]">Reason / Special Order</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Official Leave / Designated OIC under Special Order No. 2026-44"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                  />
                </div>

                <div className="pt-2 flex justify-between gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignDirection("backward");
                      setAssignStep(1);
                    }}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-1.5 rounded-lg bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isLoading ? "Assigning..." : "Confirm Delegation"}
                  </button>
                </div>
              </form>
            )}
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
