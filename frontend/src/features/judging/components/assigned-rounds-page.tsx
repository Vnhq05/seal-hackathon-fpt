"use client";

import Link from "next/link";
import { useAssignedRounds } from "@/features/judging/hooks/use-assigned-rounds";
import type { AssignedRound, RoundStatus } from "@/features/judging/types/judge.types";

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(198,198,205,0.5)",
  borderRadius: 12,
  padding: 24,
};

function SkeletonBlock({ height }: { height: number }) {
  return (
    <div className="animate-pulse rounded-lg" style={{ height, backgroundColor: "rgba(223,226,236,0.8)" }} />
  );
}

const accentColors: Record<RoundStatus, string> = {
  open: "#10b981",
  upcoming: "#f59e0b",
  closed: "#8891a5",
};

const actionLabels: Record<RoundStatus, string> = {
  open: "View submissions",
  upcoming: "Window Opens Tomorrow",
  closed: "View scored",
};

function RoundCard({ round }: { round: AssignedRound }) {
  const pct = round.total > 0 ? (round.scored / round.total) * 100 : 0;
  const accent = accentColors[round.status];

  return (
    <div className="flex overflow-hidden rounded-lg" style={{ ...cardStyle, padding: 0 }}>
      <div style={{ width: 4, backgroundColor: accent, flexShrink: 0 }} />
      <div className="flex-1" style={{ padding: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#38bdf8", marginBottom: 4 }}>
          {round.hackathonName}
        </p>
        <p style={{ fontSize: 18, fontWeight: 700, color: "#0e1528", marginBottom: 8 }}>
          {round.roundName}
        </p>

        <div className="flex flex-wrap gap-2" style={{ marginBottom: 12 }}>
          {round.criteria.map((c) => (
            <span
              key={c.name}
              className="rounded-md"
              style={{
                backgroundColor: "#ffffff",
                padding: "4px 8px",
                fontSize: 11,
                color: "#2dd4bf",
              }}
            >
              {c.name}
            </span>
          ))}
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: "#2dd4bf" }}>
              {round.scored}/{round.total} scored
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0e1528" }}>
              {Math.round(pct)}%
            </span>
          </div>
          <div style={{ height: 8, backgroundColor: "rgba(223,226,236,0.8)", borderRadius: 9999 }}>
            <div
              style={{
                height: 8,
                width: `${pct}%`,
                backgroundColor: "#10b981",
                borderRadius: 9999,
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>

        {round.status === "upcoming" ? (
          <span
            className="inline-block rounded-lg"
            style={{
              backgroundColor: "#fef3c7",
              color: "#92400e",
              padding: "8px 20px",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {actionLabels[round.status]}
          </span>
        ) : (
          <Link
            href={`/judge/rounds/${round.id}`}
            className="inline-block rounded-lg"
            style={{
              backgroundColor: round.status === "open" ? "#38bdf8" : "#dfe2ec",
              color: round.status === "open" ? "#dfe2ec" : "#0e1528",
              padding: "8px 20px",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {actionLabels[round.status]}
          </Link>
        )}
      </div>
    </div>
  );
}

export function AssignedRoundsPage() {
  const { data, isLoading } = useAssignedRounds();
  const rounds = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" style={{ padding: 32 }}>
        <SkeletonBlock height={32} />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} height={180} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" style={{ padding: 32 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.24px" }}>
          My Assigned Rounds
        </h1>
        <p style={{ fontSize: 14, color: "#2dd4bf", marginTop: 4 }}>
          View and manage your judging assignments across hackathons.
        </p>
      </div>

      {rounds.length === 0 ? (
        <p style={{ fontSize: 14, color: "#8891a5", padding: 24 }}>
          No rounds assigned yet.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {rounds.map((r) => (
            <RoundCard key={r.id} round={r} />
          ))}
        </div>
      )}
    </div>
  );
}
