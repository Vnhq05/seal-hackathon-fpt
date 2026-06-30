import Link from "next/link";
import type { JudgeDashboard } from "@/features/judging/types/judge.types";

function PlayIcon() {
  return (
    <svg width="11" height="14" viewBox="0 0 11 14" fill="none" aria-hidden="true">
      <path d="M1 1.5L10 7 1 12.5V1.5z" fill="#38bdf8" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface JudgeQuickStartProps {
  dashboard: JudgeDashboard;
  portalBase?: string;
}

export function JudgeQuickStart({ dashboard, portalBase = "/lecturer" }: JudgeQuickStartProps) {
  const nearestOpenRound = dashboard.assignedRounds
    .filter((r) => r.scored < r.total && r.status === "open")
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0];

  const unscored = dashboard.unscoredAssignments;
  const allDone = unscored.length === 0;

  return (
    <div
      className="flex flex-col items-center rounded-lg"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #38bdf8",
        padding: 25,
        boxShadow: "0px 0px 0px 1px rgba(99,102,241,0.2), 0px 10px 15px -3px rgba(99,102,241,0.1)",
      }}
    >
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 48, height: 48, backgroundColor: allDone ? "#dcfce7" : "#dcfce7", marginBottom: 16 }}
      >
        <PlayIcon />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", lineHeight: "25.2px", paddingBottom: 4 }}>
        {allDone ? "All done ✓" : "Ready to continue?"}
      </h3>
      {!allDone && (
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", textAlign: "center", paddingBottom: 16 }}>
          You have {dashboard.stats.remaining} submissions remaining
          {nearestOpenRound ? ` in ${nearestOpenRound.roundName}` : ""}.
        </p>
      )}
      {allDone ? (
        <p style={{ fontSize: 14, color: "#047857", fontWeight: 600, lineHeight: "21px", textAlign: "center", paddingBottom: 16 }}>
          All assigned teams have been scored.
        </p>
      ) : (
        <ul className="flex w-full flex-col gap-2" style={{ paddingBottom: 16 }}>
          {unscored.map((assignment) => (
            <li
              key={`${assignment.teamId}-${assignment.roundId}`}
              className="flex items-center justify-between rounded-lg"
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid rgba(223,226,236,0.8)",
                padding: "10px 12px",
              }}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span style={{ fontSize: 14, fontWeight: 600, color: "#0e1528" }}>
                  {assignment.teamName}
                </span>
                <span
                  className="w-fit rounded-md"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 8px",
                    backgroundColor: "#eef0f6",
                    color: "#2dd4bf",
                  }}
                >
                  {assignment.trackName ?? "—"}
                </span>
              </div>
              <Link
                href={`${portalBase}/scoring/${assignment.teamId}/${assignment.roundId}`}
                className="flex shrink-0 items-center gap-1"
                style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8" }}
              >
                Score <ArrowIcon />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link
        href={`${portalBase}/rounds`}
        className="flex w-full items-center justify-center gap-2 rounded-lg"
        style={{
          backgroundColor: allDone ? "#38bdf8" : "transparent",
          border: allDone ? "none" : "1px solid rgba(223,226,236,0.8)",
          padding: "8px 16px",
          fontSize: 14,
          fontWeight: 700,
          color: allDone ? "#0e1528" : "#8891a5",
          lineHeight: "21px",
        }}
      >
        View all rounds <ArrowIcon />
      </Link>
    </div>
  );
}
