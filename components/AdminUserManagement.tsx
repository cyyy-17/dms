"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveUserAction,
  rejectUserAction,
  updateUserRoleUnitAction,
  createUserDirectAction,
  suspendUserAction,
  reactivateUserAction,
  resetUserPasswordAction,
} from "@/actions/admin";
import {
  UserPlus,
  Search,
  KeyRound,
  Ban,
  RotateCcw,
  Edit2,
  CheckCircle,
  AlertCircle,
  X,
  Building,
} from "lucide-react";
import DataTableWrapper from "@/components/DataTableWrapper";
import { UserRole, UserStatus } from "@prisma/client";
import { getRoleLabel } from "@/lib/status-labels";

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
  unit: { id: string; code: string; name: string } | null;
}

interface UnitItem {
  id: string;
  code: string;
  name: string;
}

export default function AdminUserManagement({
  users,
  units,
}: {
  users: UserItem[];
  units: UnitItem[];
}) {
  const router = useRouter();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [unitFilter, setUnitFilter] = useState("ALL");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserItem | null>(null);
  const [rejectUser, setRejectUser] = useState<UserItem | null>(null);
  const [suspendUser, setSuspendUser] = useState<UserItem | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
    role: UserRole;
    unitId: string;
    password: string;
  }>({
    firstName: "",
    lastName: "",
    email: "",
    employeeId: "",
    role: UserRole.STAFF,
    unitId: units[0]?.id || "",
    password: "",
  });

  const [editForm, setEditForm] = useState<{
    firstName: string;
    lastName: string;
    employeeId: string;
    role: UserRole;
    unitId: string;
    status: UserStatus;
  }>({
    firstName: "",
    lastName: "",
    employeeId: "",
    role: UserRole.STAFF,
    unitId: "",
    status: UserStatus.ACTIVE,
  });

  const [customPassword, setCustomPassword] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
    const matchesUnit = unitFilter === "ALL" || u.unitId === unitFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesUnit;
  });

  // Handle Direct User Creation
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    const res = await createUserDirectAction({
      firstName: createForm.firstName,
      lastName: createForm.lastName,
      email: createForm.email,
      employeeId: createForm.employeeId,
      role: createForm.role,
      unitId: createForm.unitId || undefined,
      password: createForm.password || undefined,
    });

    setIsLoading(false);
    if (res.success) {
      setFeedback({ type: "success", message: "Employee provisioned and activated successfully." });
      setIsCreateModalOpen(false);
      setCreateForm({
        firstName: "",
        lastName: "",
        email: "",
        employeeId: "",
        role: UserRole.STAFF,
        unitId: units[0]?.id || "",
        password: "",
      });
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to create user." });
    }
  };

  // Handle User Edit
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setIsLoading(true);
    setFeedback(null);

    const res = await updateUserRoleUnitAction({
      userId: editUser.id,
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      employeeId: editForm.employeeId,
      role: editForm.role,
      unitId: editForm.unitId || null,
      status: editForm.status,
    });

    setIsLoading(false);
    if (res.success) {
      setFeedback({ type: "success", message: "User profile updated successfully." });
      setEditUser(null);
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to update user." });
    }
  };

  // Handle Approval
  const handleApprove = async (user: UserItem, role: UserRole, unitId: string) => {
    setIsLoading(true);
    const res = await approveUserAction({ userId: user.id, role, unitId });
    setIsLoading(false);
    if (res.success) {
      setFeedback({ type: "success", message: `Approved ${user.firstName} ${user.lastName}.` });
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to approve user." });
    }
  };

  // Handle Rejection
  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectUser) return;
    setIsLoading(true);
    const res = await rejectUserAction({ userId: rejectUser.id, reason: actionReason });
    setIsLoading(false);
    if (res.success) {
      setFeedback({ type: "success", message: `Rejected registration for ${rejectUser.email}.` });
      setRejectUser(null);
      setActionReason("");
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to reject registration." });
    }
  };

  // Handle Suspension
  const handleSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendUser) return;
    setIsLoading(true);
    const res = await suspendUserAction(suspendUser.id, actionReason || "Administrative suspension");
    setIsLoading(false);
    if (res.success) {
      setFeedback({ type: "success", message: `Suspended account for ${suspendUser.email}.` });
      setSuspendUser(null);
      setActionReason("");
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to suspend account." });
    }
  };

  // Handle Reactivate
  const handleReactivate = async (user: UserItem) => {
    setIsLoading(true);
    const res = await reactivateUserAction(user.id);
    setIsLoading(false);
    if (res.success) {
      setFeedback({ type: "success", message: `Reactivated account for ${user.email}.` });
      router.refresh();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to reactivate account." });
    }
  };

  // Handle Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    setIsLoading(true);
    const res = await resetUserPasswordAction({
      userId: resetPasswordUser.id,
      newPassword: customPassword || undefined,
    });
    setIsLoading(false);
    if (res.success) {
      setFeedback({
        type: "success",
        message: `Password reset successfully! Temporary password: ${res.temporaryPassword}`,
      });
      setResetPasswordUser(null);
      setCustomPassword("");
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to reset password." });
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

      {/* Action Bar & Filters */}
      <div className="glass-card rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-56 flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name, Email, or Employee ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-900 border border-slate-300 rounded-lg bg-white placeholder:text-slate-400"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs font-medium text-slate-900 py-2 px-3 border border-slate-300 rounded-lg bg-white"
          >
            <option value="ALL">All Roles</option>
            <option value="STAFF">Department Staff</option>
            <option value="COORDINATOR">Unit Coordinator</option>
            <option value="DIRECTOR">Executive Director</option>
            <option value="ADMIN">System Administrator</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium text-slate-900 py-2 px-3 border border-slate-300 rounded-lg bg-white"
          >
            <option value="ALL">All Account Statuses</option>
            <option value="ACTIVE">Verified Active</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="text-xs font-medium text-slate-900 py-2 px-3 border border-slate-300 rounded-lg bg-white"
          >
            <option value="ALL">All Units</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.code})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-[#0F2962] hover:bg-[#091a42] text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 shrink-0 self-start md:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-amber-400" />
          <span>Provision Employee</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <DataTableWrapper>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-6">Employee</th>
                <th className="py-3.5 px-6">Employee ID</th>
                <th className="py-3.5 px-6">Role & Designation</th>
                <th className="py-3.5 px-6">Assigned Unit</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions & Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No employees matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 block">
                        {u.firstName} {u.lastName}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400 block">{u.email}</span>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-600">
                      {u.employeeId || <span className="text-slate-300 italic">Unassigned</span>}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 font-bold text-[10px] border border-blue-200">
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-700">
                      {u.unit ? `${u.unit.name} (${u.unit.code})` : <span className="text-slate-400 italic">All Department Units</span>}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === UserStatus.ACTIVE
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : u.status === UserStatus.PENDING_APPROVAL
                            ? "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
                            : u.status === UserStatus.SUSPENDED
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : "bg-red-100 text-red-800 border border-red-200"
                        }`}
                      >
                        {u.status === UserStatus.ACTIVE
                          ? "Verified Active"
                          : u.status === UserStatus.PENDING_APPROVAL
                          ? "Pending Approval"
                          : u.status === UserStatus.SUSPENDED
                          ? "Account Suspended"
                          : "Rejected"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {u.status === UserStatus.PENDING_APPROVAL ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleApprove(u, u.role, u.unitId || units[0]?.id)}
                            disabled={isLoading}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectUser(u)}
                            disabled={isLoading}
                            className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] transition shadow-sm"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <button
                            title="Edit Role & Unit"
                            onClick={() => {
                              setEditUser(u);
                              setEditForm({
                                firstName: u.firstName,
                                lastName: u.lastName,
                                employeeId: u.employeeId || "",
                                role: u.role,
                                unitId: u.unitId || "",
                                status: u.status,
                              });
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            title="Reset Password"
                            onClick={() => setResetPasswordUser(u)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 text-amber-700 transition"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {u.status === UserStatus.ACTIVE ? (
                            <button
                              title="Suspend Account"
                              onClick={() => setSuspendUser(u)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 text-red-600 transition"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          ) : u.status === UserStatus.SUSPENDED ? (
                            <button
                              title="Reactivate Account"
                              onClick={() => handleReactivate(u)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-emerald-50 text-emerald-600 transition"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          ) : null}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableWrapper>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: Direct Employee Provisioning */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0F2962]" />
                <span>Provision New Employee</span>
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 uppercase mb-1 block">First Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 uppercase mb-1 block">Last Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">
                  Institutional Email (@firstasia.edu.ph)
                </label>
                <input
                  type="email"
                  required
                  placeholder="employee@firstasia.edu.ph"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 uppercase mb-1 block">
                    Employee ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="EMP-2026-XXX"
                    value={createForm.employeeId}
                    onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 uppercase mb-1 block">Assigned Role</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="STAFF">Department Staff</option>
                    <option value="COORDINATOR">Unit Coordinator</option>
                    <option value="DIRECTOR">Executive Director</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">Department Unit</label>
                <select
                  value={createForm.unitId}
                  onChange={(e) => setCreateForm({ ...createForm, unitId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">No Specific Unit (General / Director / Admin)</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">
                  Initial Password (Optional — Defaults to Temporary)
                </label>
                <input
                  type="password"
                  placeholder="Leave blank for FaithSAS2026!Temporary"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-[#0F2962] hover:bg-[#091a42] text-white font-semibold"
                >
                  {isLoading ? "Provisioning..." : "Provision & Activate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: Edit Employee Profile */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {editUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <span>Edit Employee Details</span>
              </h2>
              <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 uppercase mb-1 block">First Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 uppercase mb-1 block">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">Employee ID</label>
                <input
                  type="text"
                  value={editForm.employeeId}
                  onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">Assigned Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="STAFF">Department Staff</option>
                  <option value="COORDINATOR">Unit Coordinator</option>
                  <option value="DIRECTOR">Executive Director</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">Assigned Unit</label>
                <select
                  value={editForm.unitId}
                  onChange={(e) => setEditForm({ ...editForm, unitId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">No Specific Unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">Account Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as UserStatus })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="ACTIVE">Verified Active</option>
                  <option value="SUSPENDED">Account Suspended</option>
                  <option value="PENDING_APPROVAL">Pending Review</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-[#0F2962] hover:bg-[#091a42] text-white font-semibold"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: Reset Password */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {resetPasswordUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <span>Reset Employee Password</span>
              </h2>
              <button
                onClick={() => setResetPasswordUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Resetting credentials for{" "}
              <strong>
                {resetPasswordUser.firstName} {resetPasswordUser.lastName}
              </strong>{" "}
              ({resetPasswordUser.email}).
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">
                  New Custom Password (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave empty for auto-generated secure password"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  {isLoading ? "Resetting..." : "Confirm Password Reset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: Suspend Account Modal */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {suspendUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-red-900 flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-600" />
                <span>Suspend Employee Account</span>
              </h2>
              <button onClick={() => setSuspendUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to suspend{" "}
              <strong>
                {suspendUser.firstName} {suspendUser.lastName}
              </strong>
              ? This will revoke active logins immediately.
            </p>

            <form onSubmit={handleSuspend} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">
                  Suspension Reason (Audited)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. End of contract / administrative clearance required"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSuspendUser(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  {isLoading ? "Suspending..." : "Confirm Suspension"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 5: Reject Registration Modal */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {rejectUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-red-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-red-600" />
                <span>Reject Registration Request</span>
              </h2>
              <button onClick={() => setRejectUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReject} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 uppercase mb-1 block">
                  Mandatory Rejection Feedback
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why this account registration was not approved..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectUser(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
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
