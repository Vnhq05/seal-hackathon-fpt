"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useMyTeamsAllEvents, type MyEventTeam } from "@/features/teams/hooks/use-my-teams-all-events";
import { TeamDetailPanel } from "@/features/teams/components/team-detail-panel";
import { NoTeamPanel } from "@/features/teams/components/no-team-panel";
import { PastParticipationTab } from "@/features/teams/components/past-participation-tab";
import { PendingInvitationsBanner } from "@/features/teams/components/pending-invitations-banner";
import { useMyActiveEnrollment } from "@/features/events/hooks/use-enrollment";
import { useTeamInvitation } from "@/features/teams/hooks/use-team-invitation";
import type { InvitationResponse } from "@/lib/api";

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
  const qc = useQueryClient();
  const { data: allTeams, isLoading } = useMyTeamsAllEvents();
  const { data: activeEnrollment } = useMyActiveEnrollment();
  const { data: invitations } = useTeamInvitation();
  const [tab, setTab] = useState<"current" | "past">("current");
  const [selectedIdx, setSelectedIdx] = useState(0);

  const pendingInvitations = Array.isArray(invitations) ? invitations : [];

  const { currentTeams, pastTeams } = useMemo(() => {
    if (!allTeams) return { currentTeams: [] as MyEventTeam[], pastTeams: [] as MyEventTeam[] };
    return {
      currentTeams: allTeams.filter((mt) => mt.event.status !== "COMPLETED"),
      pastTeams: allTeams.filter((mt) => mt.event.status === "COMPLETED"),
    };
  }, [allTeams]);

  const selected = currentTeams[selectedIdx] ?? null;

  const handleTeamCreated = () => {
    qc.invalidateQueries({ queryKey: ["my-teams-all-events"] });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <SkeletonBlock height={56} />
        <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          <SkeletonBlock height={200} />
          <SkeletonBlock height={400} />
        </div>
      </div>
    );
  }

  const enrollmentPending = activeEnrollment?.status === "PENDING";
  const enrollmentApprovedNoTeams =
    activeEnrollment?.status === "APPROVED" && currentTeams.length === 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-seal-text">My Teams</h1>
          <p className="mt-1 text-sm text-seal-text-secondary">
            Manage your teams across hackathon events.
          </p>
        </div>
        <span className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-1.5 text-xs font-medium text-seal-text-secondary">
          {(allTeams?.length ?? 0)} event{(allTeams?.length ?? 0) === 1 ? "" : "s"}
        </span>
      </div>

      <PendingInvitationsBanner invitations={pendingInvitations as InvitationResponse[]} />

      <div className="flex gap-1 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-1 self-start">
        {([
          { key: "current" as const, label: "Current" },
          { key: "past" as const, label: "Past participation" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-seal-yellow text-navy font-mono font-bold"
                : "text-seal-text-muted hover:text-seal-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "current" && (
        <>
          {currentTeams.length === 0 ? (
            <div className="flex flex-col gap-4">
              {enrollmentApprovedNoTeams && allTeams?.[0]?.event ? (
                <NoTeamPanel event={allTeams[0].event} onTeamCreated={handleTeamCreated} />
              ) : enrollmentPending ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center">
                  <p className="font-semibold text-amber-800">Đang chờ duyệt đăng ký — chưa thể tạo/tham gia team</p>
                  <p className="mt-1 text-sm text-amber-700">
                    Your registration is waiting for coordinator approval.
                  </p>
                </div>
              ) : (
                <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-8 text-center">
                  <p className="font-semibold text-seal-text">No active teams yet</p>
                  <p className="mt-1 text-sm text-seal-text-muted">
                    Register for an open event from the Dashboard to create your team.
                  </p>
                  <Link
                    href="/student"
                    className="mt-4 inline-flex border-2 border-navy bg-seal-yellow px-4 py-2 text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228]"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-[280px_1fr]">
              <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] overflow-hidden self-start">
                <div className="border-b border-seal-border-light px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-seal-text-muted">
                  Events you joined
                </div>
                <div className="divide-y divide-seal-border-light">
                  {currentTeams.map((mt, idx) => {
                    const active = idx === selectedIdx;
                    const team = mt.team;
                    const sc = team
                      ? (STATUS_COLORS[team.status] ?? "bg-seal-surface-elevated text-seal-text-secondary")
                      : "bg-amber-50 text-amber-700";
                    return (
                      <button
                        key={mt.event.id}
                        onClick={() => setSelectedIdx(idx)}
                        className={`w-full px-4 py-3 text-left transition-colors ${active ? "bg-seal-cyan/5" : "hover:bg-seal-surface-sunken"}`}
                      >
                        <div className="flex items-center gap-2">
                          <TrophyIcon />
                          <span className="text-sm font-semibold text-seal-text truncate">{mt.event.name}</span>
                        </div>
                        <div className="mt-1 text-xs text-seal-text-muted truncate">
                          {team ? `Team: ${team.name}` : "No team yet"}
                        </div>
                        <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-medium ${sc}`}>
                          {team ? team.status : "ENROLLED"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selected?.team ? (
                <TeamDetailPanel
                  key={selected.team.id}
                  event={selected.event}
                  team={selected.team}
                />
              ) : selected?.event ? (
                <NoTeamPanel event={selected.event} onTeamCreated={handleTeamCreated} />
              ) : null}
            </div>
          )}
        </>
      )}

      {tab === "past" && <PastParticipationTab pastTeams={pastTeams} />}
    </div>
  );
}
