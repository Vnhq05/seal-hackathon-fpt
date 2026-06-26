"use client";

import { useState } from "react";
import { usePendingUsers } from "@/features/coordinator/hooks/use-pending-users";
import { useApproveRejectUser } from "@/features/coordinator/hooks/use-approve-reject-user";
import type { PendingUser } from "@/features/coordinator/types/staff.types";

const statusBadge: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold capitalize ${
        statusBadge[status] ?? "bg-seal-surface-elevated text-seal-text-muted"
      }`}
    >
      {status}
    </span>
  );
}

function RowSkeleton() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-3.5 w-3/5 animate-pulse rounded bg-seal-border/60" />
        </td>
      ))}
    </tr>
  );
}

function UserRow({
  user,
  onAction,
}: {
  user: PendingUser;
  onAction: (userId: string, action: "approve" | "reject") => void;
}) {
  return (
    <tr className="border-t border-seal-border/40">
      <td className="px-4 py-3.5 text-sm font-semibold text-seal-text">{user.name}</td>
      <td className="px-4 py-3.5 text-sm text-seal-text-muted">{user.email}</td>
      <td className="px-4 py-3.5 text-sm text-seal-text">{user.role}</td>
      <td className="px-4 py-3.5 text-sm text-seal-text-muted">
        {new Date(user.registeredDate).toLocaleDateString()}
      </td>
      <td className="px-4 py-3.5">
        <StatusBadge status={user.status} />
      </td>
      <td className="px-4 py-3.5">
        {user.status === "pending" && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onAction(user.id, "approve")}
              className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => onAction(user.id, "reject")}
              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-seal-border/80 bg-seal-bg py-16 text-center">
      <p className="text-base font-semibold text-seal-text">No pending approvals</p>
      <p className="mt-1 text-sm text-seal-text-muted">
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
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-seal-text">
          User Approval
        </h1>
        <p className="mt-1 text-sm text-seal-text-muted">
          Review and approve pending user registrations.
        </p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full max-w-sm rounded-lg border border-seal-border/80 bg-white px-3 py-2 text-sm text-seal-text outline-none transition-colors focus:border-seal-purple"
        />
      </div>

      {!isLoading && users.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-xl border border-seal-border/50 bg-white shadow-sm">
          <table className="w-full border-collapse text-left">
            <thead className="bg-seal-bg">
              <tr>
                {["Name", "Email", "Role", "Registered", "Status", "Actions"].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-xs font-semibold tracking-wide text-seal-text-muted uppercase"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
                : users.map((u) => <UserRow key={u.id} user={u} onAction={handleAction} />)}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-seal-text-muted">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-seal-border/80 bg-white px-3 py-1.5 text-xs font-medium text-seal-text disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-seal-border/80 bg-white px-3 py-1.5 text-xs font-medium text-seal-text disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
