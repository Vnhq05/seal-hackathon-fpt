"use client";

import { useState, useCallback } from "react";
import { useStaffRankings, useOverrideRankings } from "@/features/staff/hooks/use-staff-rankings";
import type { RankingEntry } from "@/features/staff/types/staff.types";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5", letterSpacing: "0.24px",
  lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};

function RowSkeleton() {
  return (
    <tr>
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} />
        </td>
      ))}
    </tr>
  );
}

function RankingRow({
  entry, editedRank, onRankChange,
}: { entry: RankingEntry; editedRank: number; onRankChange: (teamId: string, rank: number) => void }) {
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={bodyCell}>
        <input
          type="number"
          min={1}
          value={editedRank}
          onChange={(e) => onRankChange(entry.teamId, parseInt(e.target.value, 10) || 1)}
          className="rounded-md"
          style={{ width: 60, padding: "4px 8px", fontSize: 14, border: "1px solid rgba(223,226,236,0.8)", textAlign: "center", outline: "none" }}
        />
      </td>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{entry.teamName}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{entry.hackathonName}</td>
      <td style={bodyCell}>
        <span className="rounded-md px-2 py-1" style={{ fontSize: 12, fontWeight: 600, backgroundColor: "#f0fdf4", color: "#166534" }}>
          {entry.score}
        </span>
      </td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{entry.trackName ?? "—"}</td>
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg py-16 text-center" style={{ border: "1px dashed rgba(223,226,236,0.8)", backgroundColor: "#fafafa" }}>
      <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>No rankings yet</p>
      <p className="mt-1" style={{ fontSize: 14, color: "#8891a5" }}>Rankings will appear once results are available.</p>
    </div>
  );
}

export function RankingManagementPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useStaffRankings({ page, pageSize: 20 });
  const { mutate: override, isPending } = useOverrideRankings();

  const entries = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  const [editedRanks, setEditedRanks] = useState<Record<string, number>>({});

  const onRankChange = useCallback((teamId: string, rank: number) => {
    setEditedRanks((prev) => ({ ...prev, [teamId]: rank }));
  }, []);

  const hasChanges = entries.some((e) => editedRanks[e.teamId] !== undefined && editedRanks[e.teamId] !== e.rank);

  const handleSave = () => {
    const rankings = entries
      .map((e) => ({ teamId: e.teamId, rank: editedRanks[e.teamId] ?? e.rank }))
      .filter((r, _, arr) => {
        const original = entries.find((e) => e.teamId === r.teamId);
        return original && original.rank !== r.rank;
      });

    if (rankings.length === 0) return;

    const hackathonId = entries[0]?.hackathonName ?? "";
    override({ rankings, hackathonId });
  };

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
            Ranking Management
          </h1>
          <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
            View and override team rankings. Edit rank numbers to reorder.
          </p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded-lg"
            style={{ padding: "8px 20px", fontSize: 14, fontWeight: 600, backgroundColor: "#38bdf8", color: "#ffffff", border: "none", cursor: "pointer" }}
          >
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>

      {!isLoading && entries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)" }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#eef0f6" }}>
                <th style={{ ...headerCell, width: 80 }}>Rank</th>
                <th style={headerCell}>Team</th>
                <th style={headerCell}>Hackathon</th>
                <th style={{ ...headerCell, width: 80 }}>Score</th>
                <th style={headerCell}>Track</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
                : entries.map((e) => (
                    <RankingRow
                      key={e.id}
                      entry={e}
                      editedRank={editedRanks[e.teamId] ?? e.rank}
                      onRankChange={onRankChange}
                    />
                  ))
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
