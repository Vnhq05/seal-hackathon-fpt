"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminRounds, useDeleteRound } from "@/features/admin/hooks/use-admin-rounds";
import { useAdminHackathons } from "@/features/admin/hooks/use-admin-hackathons";
import type { AdminRound, RoundStatus } from "@/features/admin/types/admin.types";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5",
  letterSpacing: "0.24px", lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};

const STATUS_STYLES: Record<RoundStatus, React.CSSProperties> = {
  UPCOMING: { backgroundColor: "#fffbeb", color: "#92400e" },
  ACTIVE: { backgroundColor: "#f0fdf4", color: "#166534" },
  COMPLETED: { backgroundColor: "#ffffff", color: "#2dd4bf" },
};

function RoundRow({ r }: { r: AdminRound }) {
  const { mutate: remove, isPending } = useDeleteRound();
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={bodyCell}>{r.roundNumber}</td>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{r.name}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{r.type}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>
        {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}
      </td>
      <td style={bodyCell}>
        <span
          className="inline-flex rounded-full px-2 py-1"
          style={{ fontSize: 12, fontWeight: 600, ...STATUS_STYLES[r.status] }}
        >
          {r.status}
        </span>
      </td>
      <td style={bodyCell}>{r.submissionsCount}</td>
      <td style={bodyCell}>
        <div className="flex gap-2">
          <Link href={`/admin/rounds/${r.id}`} style={{ fontSize: 12, fontWeight: 600, color: "#38bdf8" }}>
            Edit
          </Link>
          <button
            onClick={() => remove(r.id)}
            disabled={isPending}
            style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", background: "none", border: "none", cursor: "pointer" }}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export function RoundManagementPage() {
  const [hackathonId, setHackathonId] = useState<string>("");
  const { data: hackathonsData } = useAdminHackathons();
  const { data, isLoading } = useAdminRounds(hackathonId || undefined);
  const rounds = data?.data ?? [];

  const selectStyle: React.CSSProperties = {
    border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "8px 12px", fontSize: 14,
  };

  return (
    <div style={{ padding: 24 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
            Round Management
          </h1>
          <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
            Manage rounds for each hackathon.
          </p>
        </div>
        <Link
          href="/admin/rounds/new"
          className="flex items-center justify-center rounded-lg"
          style={{ backgroundColor: "#38bdf8", padding: "10px 20px", color: "#ffffff", fontSize: 14, fontWeight: 600 }}
        >
          Add Round
        </Link>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select
          value={hackathonId}
          onChange={(e) => setHackathonId(e.target.value)}
          style={selectStyle}
        >
          <option value="">All Hackathons</option>
          {hackathonsData?.data.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={{ ...headerCell, width: 60 }}>#</th>
              <th style={headerCell}>Name</th>
              <th style={{ ...headerCell, width: 80 }}>Type</th>
              <th style={headerCell}>Duration</th>
              <th style={{ ...headerCell, width: 110 }}>Status</th>
              <th style={{ ...headerCell, width: 100 }}>Submissions</th>
              <th style={{ ...headerCell, width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} style={{ padding: "14px 16px" }}>
                        <div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              : rounds.map((r) => <RoundRow key={r.id} r={r} />)
            }
            {!isLoading && rounds.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                  No rounds found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
