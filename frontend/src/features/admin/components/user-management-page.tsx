"use client";

import { useState } from "react";
import { useAdminUsers, useApproveOrReject, useCreateInternalAccount, useDeactivateUser, useDeleteUser, useReactivateUser } from "@/features/admin/hooks/use-admin-users";
import type { UserListItem, CreateInternalAccountRequest } from "@/lib/api";
import type { UserType, AccountStatus } from "@/lib/api";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5",
  letterSpacing: "0.24px", lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};
const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none",
};

const USER_TYPE_COLORS: Record<UserType, React.CSSProperties> = {
  SYSTEM_ADMIN: { backgroundColor: "#fef3c7", color: "#92400e" },
  FPT_STUDENT: { backgroundColor: "#eff6ff", color: "#1e40af" },
  EXTERNAL_STUDENT: { backgroundColor: "#f5f3ff", color: "#5b21b6" },
  LECTURER: { backgroundColor: "#fdf4ff", color: "#86198f" },
  EVENT_COORDINATOR: { backgroundColor: "#fce7f3", color: "#9d174d" },
};

const STATUS_COLORS: Record<AccountStatus, React.CSSProperties> = {
  ACTIVE: { backgroundColor: "#f0fdf4", color: "#166534" },
  PENDING: { backgroundColor: "#fef3c7", color: "#92400e" },
  REJECTED: { backgroundColor: "#fef2f2", color: "#991b1b" },
  LOCKED: { backgroundColor: "#f1f5f9", color: "#475569" },
};

const USER_TYPE_LABELS: Record<UserType, string> = {
  SYSTEM_ADMIN: "Admin",
  FPT_STUDENT: "FPT Student",
  EXTERNAL_STUDENT: "External Student",
  LECTURER: "Lecturer",
  EVENT_COORDINATOR: "Coordinator",
};

type InternalRole = CreateInternalAccountRequest["userType"];

const CREATE_ROLE_OPTIONS: { label: string; value: InternalRole }[] = [
  { label: "Coordinator", value: "EVENT_COORDINATOR" },
  { label: "Lecturer", value: "LECTURER" },
  { label: "Admin", value: "SYSTEM_ADMIN" },
];

const PROTECTED_EMAILS = new Set([
  "admin@seal.com",
  "coordinator@seal.com",
  "lecturer1@fpt.edu.vn",
  "lecturer2@fpt.edu.vn",
  "lecturer3@fpt.edu.vn",
  "lecturer4@fpt.edu.vn",
  "lecturer5@fpt.edu.vn",
]);

function isProtectedAccount(email: string): boolean {
  return PROTECTED_EMAILS.has(email.toLowerCase());
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function CreateAccountModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userType, setUserType] = useState<InternalRole>("EVENT_COORDINATOR");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);

  const { mutate, isPending, error } = useCreateInternalAccount();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Full name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!isValidEmail(email)) errs.email = "Email must be a valid email address";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    setSuccess(null);
    if (!validate()) return;
    mutate(
      { email: email.trim(), password, fullName: fullName.trim(), userType },
      {
        onSuccess: (user) => {
          setSuccess(`Account created for ${user.email}`);
          setTimeout(onClose, 1200);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md border-2 border-navy bg-white p-6 shadow-[4px_4px_0_0_#0c1228]"
        style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0e1528" }}>Create Account</h2>
        <p style={{ fontSize: 13, color: "#8891a5", marginTop: 4 }}>
          Create an internal account (Coordinator, Lecturer, or Admin).
        </p>

        {success && (
          <div style={{ marginTop: 12, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#166534" }}>
            {success}
          </div>
        )}
        {error && (
          <div style={{ marginTop: 12, backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#991b1b" }}>
            {error.message}
          </div>
        )}

        <div className="flex flex-col gap-3" style={{ marginTop: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#0e1528", display: "block", marginBottom: 4 }}>Full Name *</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ ...inputStyle, width: "100%", borderColor: fieldErrors.fullName ? "#ef4444" : undefined }} placeholder="Nguyen Van A" />
            {fieldErrors.fullName && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{fieldErrors.fullName}</p>}
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#0e1528", display: "block", marginBottom: 4 }}>Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyle, width: "100%", borderColor: fieldErrors.email ? "#ef4444" : undefined }} placeholder="user@example.com" />
            {fieldErrors.email && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{fieldErrors.email}</p>}
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#0e1528", display: "block", marginBottom: 4 }}>Password *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, width: "100%", borderColor: fieldErrors.password ? "#ef4444" : undefined }} placeholder="Min. 6 characters" />
            {fieldErrors.password && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{fieldErrors.password}</p>}
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#0e1528", display: "block", marginBottom: 4 }}>Role *</label>
            <select value={userType} onChange={(e) => setUserType(e.target.value as InternalRole)} style={{ ...inputStyle, width: "100%" }}>
              {CREATE_ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
          <button onClick={onClose} style={{ ...inputStyle, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !!success}
            style={{ backgroundColor: "#38bdf8", color: "#fff", padding: "8px 16px", borderRadius: 8, border: "none", cursor: isPending ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, opacity: isPending ? 0.7 : 1 }}
          >
            {isPending ? "Creating..." : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserRow({ u, onApprove, onReject, onDeactivate, onReactivate, onDelete, actionError }: {
  u: UserListItem;
  onApprove: (id: string) => void;
  onReject: (user: UserListItem) => void;
  onDeactivate: (user: UserListItem) => void;
  onReactivate: (user: UserListItem) => void;
  onDelete: (user: UserListItem) => void;
  actionError: string | null;
}) {
  const protectedAccount = isProtectedAccount(u.email);
  const canManage = !protectedAccount && u.userType !== "SYSTEM_ADMIN";

  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{u.fullName}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{u.email}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{u.studentId ?? "—"}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{u.schoolName ?? "—"}</td>
      <td style={bodyCell}>
        <span className="inline-flex rounded-full px-2 py-1" style={{ fontSize: 12, fontWeight: 600, ...USER_TYPE_COLORS[u.userType] }}>
          {USER_TYPE_LABELS[u.userType] ?? u.userType}
        </span>
      </td>
      <td style={bodyCell}>
        <span className="inline-flex rounded-full px-2 py-1" style={{ fontSize: 12, fontWeight: 600, ...STATUS_COLORS[u.status] }}>
          {u.status}
        </span>
      </td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
      <td style={bodyCell}>
        {u.status === "PENDING" && (
          <div className="flex gap-2">
            <button onClick={() => onApprove(u.id)} style={{ fontSize: 12, fontWeight: 600, color: "#166534", background: "none", border: "none", cursor: "pointer" }}>
              Approve
            </button>
            <button onClick={() => onReject(u)} style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", background: "none", border: "none", cursor: "pointer" }}>
              Reject
            </button>
          </div>
        )}
        {canManage && u.status === "ACTIVE" && (
          <button
            onClick={() => onDeactivate(u)}
            style={{ fontSize: 12, fontWeight: 600, color: "#92400e", background: "none", border: "none", cursor: "pointer" }}
          >
            Deactivate
          </button>
        )}
        {canManage && u.status === "LOCKED" && (
          <button
            onClick={() => onReactivate(u)}
            style={{ fontSize: 12, fontWeight: 600, color: "#166534", background: "none", border: "none", cursor: "pointer" }}
          >
            Reactivate
          </button>
        )}
        {canManage && u.status !== "PENDING" && (
          <button
            onClick={() => onDelete(u)}
            style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", background: "none", border: "none", cursor: "pointer", marginLeft: u.status === "ACTIVE" || u.status === "LOCKED" ? 8 : 0 }}
          >
            Delete
          </button>
        )}
        {actionError && (
          <p style={{ fontSize: 11, color: "#991b1b", marginTop: 4, maxWidth: 220 }}>{actionError}</p>
        )}
      </td>
    </tr>
  );
}

export function UserManagementPage() {
  const [search, setSearch] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<UserType | "">("");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "">("");
  const [page, setPage] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionErrorUserId, setActionErrorUserId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useAdminUsers({
    search: search || undefined,
    userType: userTypeFilter || undefined,
    status: statusFilter || undefined,
    page,
    size: 20,
  });

  const users = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const { mutate: approveOrReject } = useApproveOrReject();
  const { mutate: deactivateUser } = useDeactivateUser();
  const { mutate: reactivateUser } = useReactivateUser();
  const { mutate: deleteUser } = useDeleteUser();

  const handleApprove = (userId: string) => {
    approveOrReject({ userId, action: "APPROVE" });
  };

  const handleReject = (user: UserListItem) => {
    const reason = window.prompt(`Enter reason for rejecting account ${user.fullName}:`, "");
    if (reason === null) return;

    setActionError(null);
    setActionErrorUserId(null);
    approveOrReject(
      { userId: user.id, action: "REJECT", reason: reason.trim() || "Rejected by administrator" },
      {
        onError: (err) => {
          setActionErrorUserId(user.id);
          setActionError(err instanceof Error ? err.message : "Failed to reject user");
        },
      },
    );
  };

  const handleDeactivate = (user: UserListItem) => {
    if (!window.confirm(`Deactivate ${user.fullName} (${user.email})? They will no longer appear in lecturer lists.`)) {
      return;
    }
    setActionError(null);
    setActionErrorUserId(null);
    deactivateUser(user.id, {
      onError: (err) => {
        setActionErrorUserId(user.id);
        setActionError(err instanceof Error ? err.message : "Failed to deactivate user");
      },
    });
  };

  const handleReactivate = (user: UserListItem) => {
    if (!window.confirm(`Reactivate ${user.fullName} (${user.email})?`)) {
      return;
    }
    setActionError(null);
    setActionErrorUserId(null);
    reactivateUser(user.id, {
      onError: (err) => {
        setActionErrorUserId(user.id);
        setActionError(err instanceof Error ? err.message : "Failed to reactivate user");
      },
    });
  };

  const handleDelete = (user: UserListItem) => {
    if (!window.confirm(`Permanently delete ${user.fullName} (${user.email})? This cannot be undone.`)) {
      return;
    }
    setActionError(null);
    setActionErrorUserId(null);
    deleteUser(user.id, {
      onError: (err) => {
        setActionErrorUserId(user.id);
        setActionError(err instanceof Error ? err.message : "Failed to delete user");
      },
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          User Management
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Manage users, roles, and permissions.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3" style={{ marginBottom: 16 }}>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            style={{ ...inputStyle, width: 280 }}
            placeholder="Search by name or email..."
          />
          <select
            value={userTypeFilter}
            onChange={(e) => { setUserTypeFilter(e.target.value as UserType | ""); setPage(0); }}
            style={inputStyle}
          >
            <option value="">All Roles</option>
            <option value="SYSTEM_ADMIN">Admin</option>
            <option value="FPT_STUDENT">FPT Student</option>
            <option value="EXTERNAL_STUDENT">External Student</option>
            <option value="LECTURER">Lecturer</option>
            <option value="EVENT_COORDINATOR">Coordinator</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as AccountStatus | ""); setPage(0); }}
            style={inputStyle}
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
            <option value="LOCKED">Locked</option>
          </select>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{ backgroundColor: "#38bdf8", color: "#fff", padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}
        >
          Create Account
        </button>
      </div>

      <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={headerCell}>Name</th>
              <th style={headerCell}>Email</th>
              <th style={{ ...headerCell, width: 110 }}>Student ID</th>
              <th style={{ ...headerCell, width: 140 }}>School</th>
              <th style={{ ...headerCell, width: 130 }}>Role</th>
              <th style={{ ...headerCell, width: 110 }}>Status</th>
              <th style={{ ...headerCell, width: 110 }}>Joined</th>
              <th style={{ ...headerCell, width: 140 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} style={{ padding: "14px 16px" }}><div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} /></td>
                  ))}</tr>
                ))
              : users.map((u) => (
                  <UserRow
                    key={u.id}
                    u={u}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onDeactivate={handleDeactivate}
                    onReactivate={handleReactivate}
                    onDelete={handleDelete}
                    actionError={actionErrorUserId === u.id ? actionError : null}
                  />
                ))
            }
            {!isLoading && isError && (
              <tr>
                <td colSpan={8} style={{ ...bodyCell, textAlign: "center", color: "#991b1b", padding: "48px 16px" }}>
                  {error?.message || "Failed to load users. Please check your login session."}
                </td>
              </tr>
            )}
            {!isLoading && !isError && users.length === 0 && (
              <tr>
                <td colSpan={8} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2" style={{ marginTop: 16 }}>
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            style={{ ...inputStyle, cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.5 : 1 }}
          >
            Previous
          </button>
          <span style={{ fontSize: 14, color: "#8891a5" }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            style={{ ...inputStyle, cursor: page >= totalPages - 1 ? "default" : "pointer", opacity: page >= totalPages - 1 ? 0.5 : 1 }}
          >
            Next
          </button>
        </div>
      )}
      {showCreateModal && <CreateAccountModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
