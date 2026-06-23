"use client";

import { useState } from "react";
import { useAdminUsers, useApproveOrReject } from "@/features/admin/hooks/use-admin-users";
import type { UserListItem } from "@/lib/api";
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

function UserRow({ u, onApprove, onReject }: {
  u: UserListItem;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{u.fullName}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{u.email}</td>
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
            <button onClick={() => onReject(u.id)} style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", background: "none", border: "none", cursor: "pointer" }}>
              Reject
            </button>
          </div>
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

  const { data, isLoading } = useAdminUsers({
    search: search || undefined,
    userType: userTypeFilter || undefined,
    status: statusFilter || undefined,
    page,
    size: 20,
  });

  const users = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const { mutate: approveOrReject } = useApproveOrReject();

  const handleApprove = (userId: string) => {
    approveOrReject({ userId, action: "APPROVE" });
  };

  const handleReject = (userId: string) => {
    approveOrReject({ userId, action: "REJECT" });
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

      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
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

      <div className="overflow-hidden rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={headerCell}>Name</th>
              <th style={headerCell}>Email</th>
              <th style={{ ...headerCell, width: 130 }}>Role</th>
              <th style={{ ...headerCell, width: 110 }}>Status</th>
              <th style={{ ...headerCell, width: 110 }}>Joined</th>
              <th style={{ ...headerCell, width: 140 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} style={{ padding: "14px 16px" }}><div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} /></td>
                  ))}</tr>
                ))
              : users.map((u) => (
                  <UserRow key={u.id} u={u} onApprove={handleApprove} onReject={handleReject} />
                ))
            }
            {!isLoading && users.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
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
    </div>
  );
}
