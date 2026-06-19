"use client";

import { useState } from "react";
import { usePendingUsers } from "@/features/staff/hooks/use-pending-users";
import { useApproveRejectUser } from "@/features/staff/hooks/use-approve-reject-user";
import type { PendingUser } from "@/features/staff/types/staff.types";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5", letterSpacing: "0.24px",
  lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};

const statusColors: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#fef3c7", color: "#92400e" },
  approved: { bg: "#ecfdf5", color: "#047857" },
  rejected: { bg: "#fef2f2", color: "#dc2626" },
};

function StatusBadge({ status }: { status: string }) {
  const c = statusColors[status] ?? { bg: "#eef0f6", color: "#2dd4bf" };
  return (
    <span className="rounded-md px-2 py-1" style={{ fontSize: 12, fontWeight: 600, backgroundColor: c.bg, color: c.color }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function RowSkeleton() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} />
        </td>
      ))}
    </tr>
  );
}

function UserRow({ user, onAction }: { user: PendingUser; onAction: (userId: string, action: "approve" | "reject") => void }) {
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{user.name}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{user.email}</td>
      <td style={bodyCell}>{user.role}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{new Date(user.registeredDate).toLocaleDateString()}</td>
      <td style={bodyCell}><StatusBadge status={user.status} /></td>
      <td style={bodyCell}>
        {user.status === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={() => onAction(user.id, "approve")}
              className="rounded-md px-3 py-1"
              style={{ fontSize: 12, fontWeight: 600, backgroundColor: "#ecfdf5", color: "#047857", border: "none", cursor: "pointer" }}
            >
              Approve
            </button>
            <button
              onClick={() => onAction(user.id, "reject")}
              className="rounded-md px-3 py-1"
              style={{ fontSize: 12, fontWeight: 600, backgroundColor: "#fef2f2", color: "#dc2626", border: "none", cursor: "pointer" }}
            >
              Reject
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg py-16 text-center"
      style={{ border: "1px dashed rgba(223,226,236,0.8)", backgroundColor: "#fafafa" }}
    >
      <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>No pending approvals</p>
      <p className="mt-1" style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px" }}>
        All user registrations have been processed.
      </p>
    </div>
  );
}

export function UserApprovalPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePendingUsers({ page, pageSize: 10, search: search || undefined });
  const { mutate: approveReject } = useApproveRejectUser();

  const users = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 10);

  const handleAction = (userId: string, action: "approve" | "reject") => {
    approveReject({ userId, action });
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          User Approval
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Review and approve pending user registrations.
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-lg"
          style={{
            width: 320, padding: "8px 12px", fontSize: 14, border: "1px solid rgba(223,226,236,0.8)",
            outline: "none", color: "#0e1528", backgroundColor: "#ffffff",
          }}
        />
      </div>

      {!isLoading && users.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)" }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#eef0f6" }}>
                <th style={headerCell}>Name</th>
                <th style={headerCell}>Email</th>
                <th style={headerCell}>Role</th>
                <th style={headerCell}>Registered Date</th>
                <th style={{ ...headerCell, width: 100 }}>Status</th>
                <th style={{ ...headerCell, width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
                : users.map((u) => <UserRow key={u.id} user={u} onAction={handleAction} />)
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
          <p style={{ fontSize: 12, color: "#8891a5" }}>
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md px-3 py-1"
              style={{ fontSize: 12, border: "1px solid rgba(223,226,236,0.8)", backgroundColor: "#ffffff", cursor: page <= 1 ? "default" : "pointer", opacity: page <= 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-md px-3 py-1"
              style={{ fontSize: 12, border: "1px solid rgba(223,226,236,0.8)", backgroundColor: "#ffffff", cursor: page >= totalPages ? "default" : "pointer", opacity: page >= totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
