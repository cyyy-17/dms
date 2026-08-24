"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveUserAction, rejectUserAction, updateUserRoleUnitAction } from "@/actions/admin";
import { AlertCircle, CheckCircle } from "lucide-react";
import { UserRole, UserStatus } from "@prisma/client";

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
  const router = useRouter();
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
        router.refresh();
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
      setError("Please provide a rejection reason.");
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
        router.refresh();
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
        router.refresh();
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
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-xs font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-6">Employee</th>
                <th className="py-3.5 px-6">Institutional Email</th>
                <th className="py-3.5 px-6">Unit</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 px-6 font-semibold text-slate-900">
                    {u.firstName} {u.lastName}
                    {u.employeeId && (
                      <span className="text-[10px] text-slate-400 block font-normal">
                        ID: {u.employeeId}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-slate-600 font-mono">{u.email}</td>
                  <td className="py-4 px-6 font-medium text-slate-700">
                    {u.unit?.name || "Unassigned"}
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[10px]">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === UserStatus.ACTIVE
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : u.status === UserStatus.PENDING_APPROVAL
                          ? "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    {u.status === UserStatus.PENDING_APPROVAL ? (
                      <>
                        <button
                          onClick={() => handleApprove(u)}
                          disabled={isLoading}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowRejectModal(true);
                          }}
                          disabled={isLoading}
                          className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold transition"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setRole(u.role);
                          setUnitId(u.unitId || units[0]?.id || "");
                          setShowEditModal(true);
                        }}
                        className="text-xs font-semibold text-[#0F2962] hover:underline"
                      >
                        Edit Role / Unit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role & Unit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Update User Role & Department Unit
            </h3>
            <p className="text-xs text-slate-600">
              Editing permissions for <strong>{selectedUser.firstName} {selectedUser.lastName}</strong> ({selectedUser.email})
            </p>

            <form onSubmit={handleUpdateRoleUnit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  System Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="STAFF">STAFF (Unit submissions only)</option>
                  <option value="COORDINATOR">COORDINATOR (Unit level-1 review)</option>
                  <option value="DIRECTOR">DIRECTOR (Department-wide final review)</option>
                  <option value="ADMIN">ADMIN (Full system administrator)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assigned Unit
                </label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-lg bg-[#0F2962] text-white text-xs font-semibold shadow"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Reject Registration Request
            </h3>
            <p className="text-xs text-slate-600">
              Rejecting <strong>{selectedUser.firstName} {selectedUser.lastName}</strong> ({selectedUser.email})
            </p>

            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason for Rejection
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Unrecognized employee or wrong department..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="block w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold shadow"
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
