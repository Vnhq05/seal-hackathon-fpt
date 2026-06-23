"use client";

import Link from "next/link";
import { useAssignedRounds } from "@/features/judging/hooks/use-assigned-rounds";
import { usePortalBase } from "@/shared/hooks/use-portal-base";

const statusColors: Record<string, { bg: string; color: string; border: string }> = {
  open: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  upcoming: { bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
  closed: { bg: "#eef0f6", color: "#2dd4bf", border: "rgba(223,226,236,0.8)" },
};

function RoundCard({ round }: { round: { id: string; hackathonName: string; roundName: string; status: string; scored: number; total: number; criteria: { name: string }[] } }) {
  const sc = statusColors[round.status] ?? statusColors.closed;
  const remaining = round.total - round.scored;
  const progress = round.total > 0 ? Math.round((round.scored / round.total) * 100) : 0;

  return (
    <div
      className="rounded-lg"
      style={{ backgroundColor: "#ffffff", border: "1px solid rgba(223,226,236,0.8)", borderLeft: `4px solid ${sc.border}`, padding: 24 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
            <span
              className="rounded-full px-2 py-1"
              style={{ fontSize: 11, fontWeight: 600, backgroundColor: sc.bg, color: sc.color }}
            >
              {round.status.charAt(0).toUpperCase() + round.status.slice(1)}
            </span>
            <span style={{ fontSize: 12, color: "#8891a5" }}>{round.hackathonName}</span>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0e1528", marginBottom: 8 }}>
            {round.roundName}
          </h3>
          <div className="flex flex-wrap gap-1">
            {round.criteria.map((c) => (
              <span
                key={c.name}
                className="rounded-md px-2 py-1"
                style={{ fontSize: 11, fontWeight: 500, backgroundColor: "#ffffff", color: "#8891a5", border: "1px solid rgba(223,226,236,0.8)" }}
              >
                {c.name}
              </span>
            ))}
          </div>
        </div>

        <div style={{ minWidth: 200, textAlign: "right" }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: "#8891a5" }}>Progress</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0e1528" }}>
              {round.scored} / {round.total} scored
            </span>
          </div>
          <div className="rounded-full" style={{ height: 6, backgroundColor: "rgba(223,226,236,0.8)", marginBottom: 12 }}>
            <div className="rounded-full" style={{ height: 6, backgroundColor: "#38bdf8", width: `${progress}%` }} />
          </div>
          {round.status === "open" && remaining > 0 ? (
            <Link
              href={`${portalBase}/rounds/${round.id}`}
              className="inline-flex items-center justify-center rounded-lg"
              style={{ padding: "8px 24px", fontSize: 13, fontWeight: 600, backgroundColor: "#38bdf8", color: "#0e1528" }}
            >
              Score Submissions
            </Link>
          ) : round.status === "open" && remaining === 0 ? (
            <span
              className="inline-flex rounded-lg px-4 py-2"
              style={{ fontSize: 13, fontWeight: 600, backgroundColor: "#f0fdf4", color: "#166534" }}
            >
              All Scored
            </span>
          ) : (
            <span
              className="inline-flex rounded-lg px-4 py-2"
              style={{ fontSize: 13, fontWeight: 500, backgroundColor: "#ffffff", color: "#2dd4bf", border: "1px solid rgba(223,226,236,0.8)" }}
            >
              {round.status === "upcoming" ? "Opens Soon" : "Closed"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return <div className="animate-pulse rounded-lg" style={{ height: 140, backgroundColor: "rgba(223,226,236,0.8)", border: "1px solid rgba(223,226,236,0.8)" }} />;
}

export function JudgeScoringListPage() {
  const portalBase = usePortalBase();
  const { data, isLoading } = useAssignedRounds();
  const rounds = data?.data ?? [];

  return (
    <div style={{ padding: 32, maxWidth: 1120 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Submissions to Score
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Select a round to begin scoring submissions assigned to you.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : rounds.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-lg py-16 text-center"
            style={{ border: "1px dashed rgba(223,226,236,0.8)", backgroundColor: "#fafafa" }}
          >
            <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>No rounds assigned</p>
            <p className="mt-1" style={{ fontSize: 14, color: "#8891a5" }}>
              You will be notified when new rounds are assigned to you.
            </p>
          </div>
        ) : (
          rounds.map((round) => <RoundCard key={round.id} round={round} />)
        )}
      </div>
    </div>
  );
}
