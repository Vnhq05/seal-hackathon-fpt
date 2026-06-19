"use client";

import { useState } from "react";
import { useAdminUsers, useSuspendUser, useActivateUser, useDeleteUser } from "@/features/admin/hooks/use-admin-users";
import type { AdminUser, UserRole, UserStatus } from "@/features/admin/types/admin.types";

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

const ROLE_COLORS: Record<UserRole, React.CSSProperties> = {
  ADMIN: { backgroundColor: "#fef3c7", color: "#92400e" },
  JUDGE: { backgroundColor: "#eef2ff", color: "#4338ca" },
  MENTOR: { backgroundColor: "#f0fdf4", color: "#166534" },
  PARTICIPANT: { backgroundColor: "#ffffff", color: "#2dd4bf" },
  STAFF: { backgroundColor: "#fce7f3", color: "#9d174d" },
};

const STATUS_COLORS: Record<UserStatus, React.CSSProperties> = {
  ACTIVE: { backgroundColor: "#f0fdf4", color: "#166534" },
  SUSPENDED: { backgroundColor: "#fef2f2", color: "#991b1b" },
};

function UserRow({ u }: { u: AdminUser }) {
  const { mutate: suspend } = useSuspendUser();
  const { mutate: activate } = useActivateUser();
  const { mutate: remove } = useDeleteUser();

  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{u.name}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{u.email}</td>
      <td style={bodyCell}>
        <span className="inline-flex rounded-full px-2 py-1" style={{ fontSize: 12, fontWeight: 600, ...ROLE_COLORS[u.role] }}>
          {u.role}
        </span>
      </td>
      <td style={bodyCell}>
        <span className="inline-flex rounded-full px-2 py-1" style={{ fontSize: 12, fontWeight: 600, ...STATUS_COLORS[u.status] }}>
          {u.status}
        </span>
      </td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{new Date(u.joinedDate).toLocaleDateString()}</td>
      <td style={bodyCell}>
        <div className="flex gap-2">
          {u.status === "ACTIVE" ? (
            <button onClick={() => suspend(u.id)} style={{ fontSize: 12, fontWeight: 600, color: "#92400e", background: "none", border: "none", cursor: "pointer" }}>
              Suspend
            </button>
          ) : (
            <button onClick={() => activate(u.id)} style={{ fontSize: 12, fontWeight: 600, color: "#166534", background: "none", border: "none", cursor: "pointer" }}>
              Activate
            </button>
          )}
          <button onClick={() => remove(u.id)} style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", background: "none", border: "none", cursor: "pointer" }}>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export function UserManagementPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const { data, isLoading } = useAdminUsers({
    search: search || undefined,
    role: roleFilter || undefined,
  });
  const users = data?.data ?? [];

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
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 280 }}
          placeholder="Search by name or email..."
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | "")}
          style={inputStyle}
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="JUDGE">Judge</option>
          <option value="MENTOR">Mentor</option>
          <option value="PARTICIPANT">Participant</option>
          <option value="STAFF">Staff</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={headerCell}>Name</th>
              <th style={headerCell}>Email</th>
              <th style={{ ...headerCell, width: 110 }}>Role</th>
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
              : users.map((u) => <UserRow key={u.id} u={u} />)
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
    </div>
  );
}
