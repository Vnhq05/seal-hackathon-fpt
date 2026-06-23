"use client";

import { useState, useMemo } from "react";
import { useMyTeamsAllEvents, type MyEventTeam } from "@/features/teams/hooks/use-my-teams-all-events";
import { TeamDetailPanel } from "@/features/teams/components/team-detail-panel";
import { PastParticipationTab } from "@/features/teams/components/past-participation-tab";

function SkeletonBlock({ height }: { height: number }) {
  return <div className="animate-pulse rounded-lg bg-seal-surface-elevated" style={{ height }} />;
}

function TrophyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M5 1h8v5a4 4 0 01-8 0V1z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 3H2a1 1 0 00-1 1v1a3 3 0 003 3M13 3h3a1 1 0 011 1v1a3 3 0 01-3 3M9 10v3M6 15h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

const STATUS_COLORS: Record<string, string> = {
  FORMING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  DISBANDED: "bg-red-50 text-red-700",
};

export function TeamCompetitionsPage() {
  const { data: allTeams, isLoading } = useMyTeamsAllEvents();
  const [tab, setTab] = useState<"current" | "past">("current");
  const [selectedIdx, setSelectedIdx] = useState(0);

  const { currentTeams, pastTeams } = useMemo(() => {
    if (!allTeams) return { currentTeams: [] as MyEventTeam[], pastTeams: [] as MyEventTeam[] };
    return {
      currentTeams: allTeams.filter((mt) => mt.event.status !== "COMPLETED"),
      pastTeams: allTeams.filter((mt) => mt.event.status === "COMPLETED"),
    };
  }, [allTeams]);

  const selected = currentTeams[selectedIdx] ?? null;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <SkeletonBlock height={56} />
        <div className="grid gap-4" style={{ gridTemplateColumns: "280px 1fr" }}>
          <SkeletonBlock height={200} />
          <SkeletonBlock height={400} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-seal-text">My Teams</h1>
          <p className="mt-1 text-sm text-seal-text-secondary">
            Manage your teams across hackathon events.
          </p>
        </div>
        <span className="rounded-lg border border-seal-border bg-seal-surface-elevated px-3 py-1.5 text-xs font-medium text-seal-text-secondary">
          {(allTeams?.length ?? 0)} event{(allTeams?.length ?? 0) === 1 ? "" : "s"}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-seal-border bg-seal-surface p-1 self-start">
        {([
          { key: "current" as const, label: "Current" },
          { key: "past" as const, label: "Past participation" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-seal-cyan/10 text-seal-cyan"
                : "text-seal-text-muted hover:text-seal-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Current Tab */}
      {tab === "current" && (
        <>
          {currentTeams.length === 0 ? (
            <div className="rounded-lg border border-seal-border bg-seal-surface p-8 text-center">
              <p className="font-semibold text-seal-text">No active teams yet</p>
              <p className="mt-1 text-sm text-seal-text-muted">
                Register for an event from the Dashboard to create your team.
              </p>
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: "280px 1fr" }}>
              {/* Sidebar */}
              <div className="rounded-lg border border-seal-border bg-seal-surface overflow-hidden self-start">
                <div className="border-b border-seal-border-light px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-seal-text-muted">
                  Events you joined
                </div>
                <div className="divide-y divide-seal-border-light">
                  {currentTeams.map((mt, idx) => {
                    const active = idx === selectedIdx;
                    const team = mt.team!;
                    const sc = STATUS_COLORS[team.status] ?? "bg-seal-surface-elevated text-seal-text-secondary";
                    return (
                      <button
                        key={team.id}
                        onClick={() => setSelectedIdx(idx)}
                        className={`w-full px-4 py-3 text-left transition-colors ${active ? "bg-seal-cyan/5" : "hover:bg-seal-surface-sunken"}`}
                      >
                        <div className="flex items-center gap-2">
                          <TrophyIcon />
                          <span className="text-sm font-semibold text-seal-text truncate">{mt.event.name}</span>
                        </div>
                        <div className="mt-1 text-xs text-seal-text-muted truncate">
                          Team: {team.name}
                        </div>
                        <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-medium ${sc}`}>
                          {team.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detail Panel */}
              {selected?.team && (
                <TeamDetailPanel
                  key={selected.team.id}
                  event={selected.event}
                  team={selected.team}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Past Tab */}
      {tab === "past" && (
        <PastParticipationTab pastTeams={pastTeams} />
      )}
    </div>
  );
}
