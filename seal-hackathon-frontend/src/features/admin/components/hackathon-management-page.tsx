"use client";

import Link from "next/link";
import { useAdminHackathons, useArchiveHackathon } from "@/features/admin/hooks/use-admin-hackathons";
import type { AdminHackathon, HackathonStatus } from "@/features/admin/types/admin.types";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5",
  letterSpacing: "0.24px", lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};

const STATUS_STYLES: Record<HackathonStatus, React.CSSProperties> = {
  DRAFT: { backgroundColor: "#ffffff", color: "#2dd4bf" },
  ACTIVE: { backgroundColor: "#f0fdf4", color: "#166534" },
  ENDED: { backgroundColor: "#fef2f2", color: "#991b1b" },
};

function StatusBadge({ status }: { status: HackathonStatus }) {
  return (
    <span
      className="inline-flex rounded-full px-2 py-1"
      style={{ fontSize: 12, fontWeight: 600, ...STATUS_STYLES[status] }}
    >
      {status}
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

function HackathonRow({ h }: { h: AdminHackathon }) {
  const { mutate: archive, isPending } = useArchiveHackathon();
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{h.name}</td>
      <td style={bodyCell}><StatusBadge status={h.status} /></td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{new Date(h.startDate).toLocaleDateString()}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{new Date(h.endDate).toLocaleDateString()}</td>
      <td style={bodyCell}>{h.teamsCount}</td>
      <td style={bodyCell}>
        <div className="flex gap-2">
          <Link
            href={`/admin/hackathons/${h.id}`}
            style={{ fontSize: 12, fontWeight: 600, color: "#38bdf8" }}
          >
            Edit
          </Link>
          <button
            onClick={() => archive(h.id)}
            disabled={isPending}
            style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", background: "none", border: "none", cursor: "pointer" }}
          >
            Archive
          </button>
        </div>
      </td>
    </tr>
  );
}

export function HackathonManagementPage() {
  const { data, isLoading } = useAdminHackathons();
  const hackathons = data?.data ?? [];

  return (
    <div style={{ padding: 24 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
            Hackathon Management
          </h1>
          <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
            Create, edit, and manage hackathons.
          </p>
        </div>
        <Link
          href="/admin/hackathons/new"
          className="flex items-center justify-center rounded-lg"
          style={{ backgroundColor: "#38bdf8", padding: "10px 20px", color: "#ffffff", fontSize: 14, fontWeight: 600 }}
        >
          Create Hackathon
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={headerCell}>Name</th>
              <th style={{ ...headerCell, width: 100 }}>Status</th>
              <th style={headerCell}>Start Date</th>
              <th style={headerCell}>End Date</th>
              <th style={{ ...headerCell, width: 80 }}>Teams</th>
              <th style={{ ...headerCell, width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
              : hackathons.map((h) => <HackathonRow key={h.id} h={h} />)
            }
            {!isLoading && hackathons.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                  No hackathons yet. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
