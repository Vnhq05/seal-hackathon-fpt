import Link from "next/link";
import type { AssignedRoundCard } from "@/features/judging/types/judge.types";

function ClockIcon() {
  return (
    <svg width="11" height="12" viewBox="0 0 11 12" fill="none" aria-hidden="true">
      <circle cx="5.5" cy="6" r="4.5" stroke="currentColor" strokeWidth="1" />
      <path d="M5.5 3.5v2.5l2 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
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

function RoundCard({ round, portalBase = "/judge" }: { round: AssignedRoundCard; portalBase?: string }) {
  const pct = round.total > 0 ? (round.scored / round.total) * 100 : 0;
  const isUpcoming = round.status === "upcoming";

  return (
    <div
      className="flex items-center justify-between rounded-lg"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid rgba(223,226,236,0.8)",
        padding: 25,
        opacity: isUpcoming ? 0.7 : 1,
      }}
    >
      <div className="flex flex-1 flex-col gap-1" style={{ minWidth: 0 }}>
        <div className="flex items-center gap-2">
          <span
            className="rounded-full"
            style={{
              backgroundColor: isUpcoming ? "#dcfce7" : "#dcfce7",
              padding: "2px 8px",
              fontSize: 12,
              fontWeight: 500,
              color: isUpcoming ? "#0e1528" : "#0e1528",
              letterSpacing: "0.24px",
              lineHeight: "12px",
            }}
          >
            {round.hackathonName}
          </span>
          <span className="flex items-center gap-1" style={{ fontSize: 12, fontWeight: 500, color: "#8891a5", letterSpacing: "0.24px", lineHeight: "12px" }}>
            <ClockIcon />
            {round.deadline}
          </span>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", lineHeight: "25.2px" }}>
          {round.roundName}
        </h3>
        <div className="flex items-center gap-4" style={{ maxWidth: 448, paddingTop: 4 }}>
          <div style={{ flex: 1, height: 8, backgroundColor: "rgba(223,226,236,0.8)", borderRadius: 9999 }}>
            <div style={{ width: `${pct}%`, height: 8, backgroundColor: "#10b981", borderRadius: 9999 }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: "#8891a5", letterSpacing: "0.24px", lineHeight: "12px", whiteSpace: "nowrap" }}>
            {round.scored}/{round.total} Scored
          </span>
        </div>
      </div>
      {isUpcoming ? (
        <span
          className="flex-shrink-0 rounded-lg"
          style={{ backgroundColor: "rgba(223,226,236,0.8)", padding: "8px 16px", fontSize: 14, fontWeight: 500, color: "#0e1528", lineHeight: "21px" }}
        >
          Not Started
        </span>
      ) : (
        <Link
          href={`${portalBase}/rounds/${round.id}`}
          className="flex flex-shrink-0 items-center gap-2 rounded-lg"
          style={{ backgroundColor: "#38bdf8", padding: "8px 16px", fontSize: 14, fontWeight: 500, color: "#0e1528", lineHeight: "21px" }}
        >
          Continue scoring <ArrowIcon />
        </Link>
      )}
    </div>
  );
}

interface JudgeAssignedRoundsSectionProps {
  rounds: AssignedRoundCard[];
  portalBase?: string;
}

export function JudgeAssignedRoundsSection({ rounds, portalBase = "/judge" }: JudgeAssignedRoundsSectionProps) {
  return (
    <div className="flex flex-col gap-6">
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", lineHeight: "25.2px" }}>
        Assigned Rounds
      </h2>
      {rounds.map((r) => (
        <RoundCard key={r.id} round={r} portalBase={portalBase} />
      ))}
    </div>
  );
}
