"use client";

import { useState } from "react";
import Link from "next/link";
import { useStaffTeams } from "@/features/staff/hooks/use-staff-teams";
import type { StaffTeam, TeamStatus } from "@/features/staff/types/staff.types";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5", letterSpacing: "0.24px",
  lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};

const statusColors: Record<string, { bg: string; color: string }> = {
  active: { bg: "#ecfdf5", color: "#047857" },
  disqualified: { bg: "#fef2f2", color: "#dc2626" },
  withdrawn: { bg: "#eef0f6", color: "#2dd4bf" },
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

function TeamRow({ team }: { team: StaffTeam }) {
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{team.name}</td>
      <td style={bodyCell}>{team.trackName ?? "—"}</td>
      <td style={bodyCell}>{team.memberCount}</td>
      <td style={bodyCell}><StatusBadge status={team.status} /></td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{team.hackathonName}</td>
      <td style={bodyCell}>
        <div className="flex gap-2">
          <button className="rounded-md px-3 py-1" style={{ fontSize: 12, fontWeight: 600, backgroundColor: "#ffffff", color: "#0e1528", border: "none", cursor: "pointer" }}>
            View
          </button>
          {team.status === "active" && (
            <Link
              href={`/staff/disqualification?teamId=${team.id}&teamName=${encodeURIComponent(team.name)}`}
              className="rounded-md px-3 py-1"
              style={{ fontSize: 12, fontWeight: 600, backgroundColor: "#fef2f2", color: "#dc2626", textDecoration: "none" }}
            >
              Disqualify
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg py-16 text-center" style={{ border: "1px dashed rgba(223,226,236,0.8)", backgroundColor: "#fafafa" }}>
      <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>No teams found</p>
      <p className="mt-1" style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px" }}>Try adjusting your filters.</p>
    </div>
  );
}

const FILTER_TABS: { label: string; value: TeamStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Disqualified", value: "disqualified" },
  { label: "Withdrawn", value: "withdrawn" },
];

export function TeamManagementPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TeamStatus | "all">("all");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useStaffTeams({
    page, pageSize: 10, search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const teams = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 10);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Team Management
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          View and manage all hackathon teams.
        </p>
      </div>

      <div className="flex items-center gap-4" style={{ marginBottom: 16 }}>
        <input
          type="text" placeholder="Search teams..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-lg"
          style={{ width: 320, padding: "8px 12px", fontSize: 14, border: "1px solid rgba(223,226,236,0.8)", outline: "none", color: "#0e1528", backgroundColor: "#ffffff" }}
        />
        <div className="flex gap-1">
          {FILTER_TABS.map((tab) => (
            <button key={tab.value} onClick={() => { setStatusFilter(tab.value); setPage(1); }} className="rounded-md px-3 py-1"
              style={{ fontSize: 12, fontWeight: statusFilter === tab.value ? 700 : 500, border: "1px solid rgba(223,226,236,0.8)", backgroundColor: statusFilter === tab.value ? "#0e1528" : "#ffffff", color: statusFilter === tab.value ? "#ffffff" : "#8891a5", cursor: "pointer" }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {!isLoading && teams.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)" }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#eef0f6" }}>
                <th style={headerCell}>Team Name</th>
                <th style={headerCell}>Track</th>
                <th style={{ ...headerCell, width: 90 }}>Members</th>
                <th style={{ ...headerCell, width: 120 }}>Status</th>
                <th style={headerCell}>Hackathon</th>
                <th style={{ ...headerCell, width: 180 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
                : teams.map((t) => <TeamRow key={t.id} team={t} />)
              }
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
          <p style={{ fontSize: 12, color: "#8891a5" }}>Page {page} of {totalPages} ({total} total)</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-md px-3 py-1" style={{ fontSize: 12, border: "1px solid rgba(223,226,236,0.8)", backgroundColor: "#ffffff", cursor: page <= 1 ? "default" : "pointer", opacity: page <= 1 ? 0.5 : 1 }}>Previous</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-md px-3 py-1" style={{ fontSize: 12, border: "1px solid rgba(223,226,236,0.8)", backgroundColor: "#ffffff", cursor: page >= totalPages ? "default" : "pointer", opacity: page >= totalPages ? 0.5 : 1 }}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
