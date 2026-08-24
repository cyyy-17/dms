"use client";

import { useState } from "react";
import { approveUserAction, rejectUserAction, updateUserRoleUnitAction } from "@/actions/admin";
import { AlertCircle, CheckCircle, Shield, XCircle, Settings, Check } from "lucide-react";
import { UserRole, UserStatus } from "@prisma/client";
import { getRoleLabel, formatHumanDate } from "@/lib/status-labels";

interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeId: string | null;
  role: UserRole;
  status: UserStatus;
  unitId: string | null;
  createdAt: Date;
  unit?: { code: string; name: string } | null;
}

interface UnitOption {
  id: string;
  code: string;
  name: string;
}

export default function AdminUserTable({
  users,
  units,
}: {
  users: UserItem[];
  units: UnitOption[];
}) {
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [role, setRole] = useState<UserRole>("STAFF");
  const [unitId, setUnitId] = useState<string>(units[0]?.id || "");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleApprove = async (u: UserItem) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await approveUserAction({
        userId: u.id,
        role: u.role || "STAFF",
        unitId: u.unitId || units[0]?.id || "",
      });

      if (!res.success) {
        setError(res.error || "Failed to approve user.");
      } else {
        setSuccessMessage(`Account for ${u.firstName} ${u.lastName} approved and activated.`);
        window.location.reload();
      }
    } catch {
      setError("Network error approving user.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!rejectReason || rejectReason.trim().length < 5) {
      setError("Please provide a rejection reason (minimum 5 characters).");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await rejectUserAction({
        userId: selectedUser.id,
        reason: rejectReason,
      });

      if (!res.success) {
        setError(res.error || "Failed to reject user.");
      } else {
        setSuccessMessage(`Registration for ${selectedUser.firstName} ${selectedUser.lastName} rejected.`);
        setShowRejectModal(false);
        window.location.reload();
      }
    } catch {
      setError("Network error rejecting user.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRoleUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await updateUserRoleUnitAction({
        userId: selectedUser.id,
        role,
        unitId,
      });

      if (!res.success) {
        setError(res.error || "Failed to update user profile.");
      } else {
        setSuccessMessage(`Permissions updated for ${selectedUser.firstName} ${selectedUser.lastName}.`);
        setShowEditModal(false);
        window.location.reload();
      }
    } catch {
      setError("Network error updating user.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4.5 rounded-2xl bg-red-50/95 border border-red-200 flex items-center gap-3 text-red-900 text-xs font-bold shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4.5 rounded-2xl bg-emerald-50/95 border border-emerald-200 flex items-center gap-3 text-emerald-900 text-xs font-bold shadow-xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="glass-panel rounded-3xl border border-white/90 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-3.5 px-6">User / Staff Member</th>
                <th className="py-3.5 px-6">Role & Designation</th>
                <th className="py-3.5 px-6">Unit Assignment</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Registered</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/90 bg-white/60">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                    No users matching the selected category.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-blue-50/40 transition-colors duration-150">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#0F2962] to-[#1E40AF] text-amber-400 font-black text-xs flex items-center justify-center border border-blue-900 shadow-xs shrink-0">
                          {u.firstName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 text-xs sm:text-sm block">
                            {u.firstName} {u.lastName}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                            {u.email} {u.employeeId ? `• ${u.employeeId}` : ""}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-100/80 text-blue-900 border border-blue-300/80">
                        <Shield className="w-3 h-3 text-amber-500" />
                        <span>{getRoleLabel(u.role)}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-800">
                        {u.unit ? `${u.unit.name} (${u.unit.code})` : "Unassigned"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          u.status === "ACTIVE"
                            ? "bg-emerald-100/90 text-emerald-800 border border-emerald-300"
                            : u.status === "PENDING_APPROVAL"
                            ? "bg-amber-100/90 text-amber-800 border border-amber-300 animate-pulse"
                            : "bg-rose-100/90 text-rose-800 border border-rose-300"
                        }`}
                      >
                        {u.status === "ACTIVE"
                          ? "Verified Active"
                          : u.status === "PENDING_APPROVAL"
                          ? "Pending Approval"
                          : "Account Suspended"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                      {formatHumanDate(u.createdAt)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.status === "PENDING_APPROVAL" && (
                          <>
                            <button
                              onClick={() => handleApprove(u)}
                              disabled={isLoading}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setShowRejectModal(true);
                              }}
                              disabled={isLoading}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {u.status === "ACTIVE" && (
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setRole(u.role);
                              setUnitId(u.unitId || units[0]?.id || "");
                              setShowEditModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <Settings className="w-3.5 h-3.5 text-slate-500" />
                            <span>Edit Role</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="glass-panel rounded-3xl p-7 max-w-md w-full bg-white shadow-2xl space-y-5 border border-white/90 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#0F2962]" />
                <span>Edit User Role & Unit Assignment</span>
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateRoleUnit} className="space-y-4.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Staff Member
                </label>
                <input
                  type="text"
                  disabled
                  value={`${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.email})`}
                  className="block w-full px-3.5 py-2.5 text-xs bg-slate-100 border border-slate-300 rounded-xl text-slate-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  System Role (RBAC) *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="block w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F2962] transition shadow-inner"
                >
                  <option value="STAFF">STAFF (Unit-Level Ingestion & Review)</option>
                  <option value="COORDINATOR">COORDINATOR (Unit Review & Stamping)</option>
                  <option value="DIRECTOR">DIRECTOR (Executive Sign-off & Cross-Unit Oversight)</option>
                  <option value="ADMIN">ADMIN (Full Governance & System Management)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Department Unit Assignment *
                </label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="block w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0F2962] transition shadow-inner"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-linear-to-r from-[#0F2962] to-[#1E40AF] hover:from-[#091a42] hover:to-[#0F2962] text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? "Updating..." : "Save Permissions"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="glass-panel rounded-3xl p-7 max-w-md w-full bg-white shadow-2xl space-y-5 border border-rose-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <h3 className="font-black text-rose-700 text-base flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <span>Reject Staff Registration</span>
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason for Rejection *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="State the compliance or administrative reason for denying access..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="block w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-600 transition shadow-inner"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
