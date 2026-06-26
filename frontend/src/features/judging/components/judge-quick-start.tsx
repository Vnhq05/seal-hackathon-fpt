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
  const nextRound = dashboard.assignedRounds.find(
    (r) => r.scored < r.total && r.status === "open",
  );

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
        style={{ width: 48, height: 48, backgroundColor: "#dcfce7", marginBottom: 16 }}
      >
        <PlayIcon />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", lineHeight: "25.2px", paddingBottom: 4 }}>
        Ready to continue?
      </h3>
      <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", textAlign: "center", paddingBottom: 16 }}>
        You have {dashboard.stats.remaining} submissions remaining in Round 2.
      </p>
      {nextRound && (
        <Link
          href={`${portalBase}/rounds/${nextRound.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-lg"
          style={{ backgroundColor: "#38bdf8", padding: "8px 16px", fontSize: 14, fontWeight: 700, color: "#0e1528", lineHeight: "21px" }}
        >
          Next unscored submission <ArrowIcon />
        </Link>
      )}
    </div>
  );
}
