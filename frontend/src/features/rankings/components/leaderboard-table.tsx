import type { LeaderboardTeam } from "@/features/rankings/types/leaderboard.types";
import { LeaderboardTableRow } from "@/features/rankings/components/leaderboard-table-row";

const tableContainerStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8,
  boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
  overflow: "auto",
};

const headerCellStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#8891a5",
  letterSpacing: "0.24px",
  lineHeight: "12px",
  padding: "8px 16px",
  whiteSpace: "nowrap" as const,
};

const COLUMNS = [
  { label: "Rank", width: 64, align: "left" as const },
  { label: "Team Name", width: 256, align: "left" as const },
  { label: "Track", width: 124, align: "left" as const },
  { label: "R1 Score", width: 125, align: "right" as const },
  { label: "R2 Score", width: 129, align: "right" as const },
  { label: "Total", width: 118, align: "right" as const },
  { label: "Status", width: 174, align: "center" as const },
];

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, rowIdx) => (
        <tr
          key={rowIdx}
          style={{ borderBottom: rowIdx < 4 ? "1px solid rgba(223,226,236,0.8)" : "none" }}
        >
          {COLUMNS.map((col, colIdx) => (
            <td
              key={colIdx}
              style={{
                padding: "18px 16px",
                width: col.width,
              }}
            >
              <div
                className="animate-pulse rounded"
                style={{
                  height: 14,
                  backgroundColor: "rgba(223,226,236,0.8)",
                  width: colIdx === 0 ? 24 : "70%",
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={COLUMNS.length} style={{ padding: "64px 24px" }}>
        <div className="flex flex-col items-center justify-center">
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            aria-hidden="true"
          >
            <rect x="4" y="28" width="12" height="16" rx="2" stroke="rgba(223,226,236,0.8)" strokeWidth="2" fill="none" />
            <rect x="18" y="12" width="12" height="32" rx="2" stroke="rgba(223,226,236,0.8)" strokeWidth="2" fill="none" />
            <rect x="32" y="20" width="12" height="24" rx="2" stroke="rgba(223,226,236,0.8)" strokeWidth="2" fill="none" />
          </svg>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528", marginTop: 16 }}>
            No rankings yet
          </p>
          <p style={{ fontSize: 14, color: "#8891a5", marginTop: 4, textAlign: "center", maxWidth: 360 }}>
            Rankings will appear here once teams have been scored.
          </p>
        </div>
      </td>
    </tr>
  );
}

interface LeaderboardTableProps {
  rankings: LeaderboardTeam[];
  isLoading: boolean;
}

export function LeaderboardTable({
  rankings,
  isLoading,
}: LeaderboardTableProps) {
  return (
    <div style={tableContainerStyle}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
        <thead>
          <tr style={{ backgroundColor: "#dcfce7", borderBottom: "1px solid rgba(223,226,236,0.8)" }}>
            {COLUMNS.map((col) => (
              <th
                key={col.label}
                style={{
                  ...headerCellStyle,
                  width: col.width,
                  textAlign: col.align,
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <TableSkeleton />
          ) : rankings.length === 0 ? (
            <EmptyState />
          ) : (
            rankings.map((team, idx) => (
              <LeaderboardTableRow
                key={team.id}
                team={team}
                isLast={idx === rankings.length - 1}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
