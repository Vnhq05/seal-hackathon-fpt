"use client";

import { useState } from "react";
import { useTeamsNeedingSupport } from "@/features/progress/hooks/use-teams-needing-support";
import { useRealtimeCountdown } from "@/features/progress/hooks/use-realtime-countdown";
import {
  formatRealtimeDeadlineDetail,
  progressReasonLabel,
} from "@/features/progress/lib/progress.utils";
import { SubmissionProgressBar } from "@/features/progress/components/submission-progress-bar";
import type {
  AtRiskTeamEntry,
  EventAtRiskGroup,
  TeamsNeedingSupportScope,
} from "@/features/progress/types/progress-board.types";
import type { ProgressRiskLevel } from "@/lib/api/progress.api";

const DEFAULT_EVENTS_VISIBLE = 2;
const DEFAULT_TEAMS_VISIBLE = 5;

const RISK_ORDER: Record<ProgressRiskLevel, number> = {
  CRITICAL: 0,
  AT_RISK: 1,
  OK: 2,
};

function teamBadge(team: AtRiskTeamEntry) {
  if (team.submissionProgressPercent >= 100) {
    return { label: "Complete", className: "text-emerald-800 bg-emerald-100/80" };
  }
  if (team.riskLevel === "CRITICAL") {
    return { label: "Critical", className: "text-[#854d0e] bg-[rgba(234,179,8,0.28)]" };
  }
  if (team.riskLevel === "AT_RISK") {
    return { label: "At risk", className: "text-[#b45309] bg-[rgba(245,158,11,0.2)]" };
  }
  return { label: "On track", className: "text-emerald-800 bg-emerald-50/80" };
}

function sortTeams(teams: AtRiskTeamEntry[]): AtRiskTeamEntry[] {
  return [...teams].sort((a, b) => {
    const aComplete = a.submissionProgressPercent >= 100 ? 1 : 0;
    const bComplete = b.submissionProgressPercent >= 100 ? 1 : 0;
    if (aComplete !== bComplete) return aComplete - bComplete;
    const riskDiff = RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel];
    if (riskDiff !== 0) return riskDiff;
    return b.submissionProgressPercent - a.submissionProgressPercent;
  });
}

function statusLine(team: AtRiskTeamEntry): string {
  if (team.submissionProgressPercent >= 100) {
    return "Submission complete";
  }
  if (team.reasons.length === 0) {
    return "In progress";
  }
  return team.reasons.map(progressReasonLabel).join(" · ");
}

function TeamProgressRow({ team }: { team: AtRiskTeamEntry }) {
  const msLeft = useRealtimeCountdown(team.submissionDeadline);
  const badge = teamBadge(team);

  if (msLeft !== null && msLeft <= 0) {
    return null;
  }

  return (
    <li className="border-t border-amber-200 bg-amber-50/70 px-5 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-navy">{team.teamName}</p>
          <p className="text-xs text-amber-800/70">
            {statusLine(team)} · {formatRealtimeDeadlineDetail(msLeft)}
          </p>
        </div>
        <span className={`shrink-0 rounded px-2 py-1 text-xs font-bold ${badge.className}`}>
          {badge.label}
        </span>
      </div>
      <div className="mt-2 w-full">
        <SubmissionProgressBar
          percent={team.submissionProgressPercent ?? 0}
          submittedParts={team.submittedParts}
          requiredParts={team.requiredParts ?? 4}
          size="sm"
        />
      </div>
    </li>
  );
}

function EventSupportCard({ group }: { group: EventAtRiskGroup }) {
  const [expanded, setExpanded] = useState(false);
  const deadlineMs = useRealtimeCountdown(group.teams[0]?.submissionDeadline);
  const openTeams =
    deadlineMs !== null && deadlineMs <= 0 ? [] : sortTeams(group.teams);

  if (openTeams.length === 0) {
    return null;
  }

  const teamCount = openTeams.length;
  const hasMore = teamCount > DEFAULT_TEAMS_VISIBLE;
  const visibleTeams = expanded ? openTeams : openTeams.slice(0, DEFAULT_TEAMS_VISIBLE);
  const hiddenCount = Math.max(0, teamCount - DEFAULT_TEAMS_VISIBLE);

  return (
    <div className="border-2 border-amber-500 bg-amber-50 shadow-[4px_4px_0_0_#0c1228]">
      <div className="border-b-2 border-amber-500 bg-seal-yellow/40 px-5 py-2.5">
        <h2 className="font-mono text-sm font-bold text-amber-900">{group.eventName}</h2>
      </div>

      <div className="px-5 py-3">
        <h3 className="font-mono text-lg font-bold text-amber-900">
          Team submission progress ({teamCount})
        </h3>
        <p className="text-sm text-amber-800/80">
          All teams in the current round before the submission deadline.
        </p>
      </div>

      <ul>
        {visibleTeams.map((team) => (
          <TeamProgressRow key={`${group.eventId}-${team.teamId}`} team={team} />
        ))}
      </ul>

      {hasMore && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full border-t-2 border-amber-500 bg-seal-yellow/40 px-5 py-3 text-center font-mono text-sm font-bold text-amber-900 transition-colors hover:bg-seal-yellow/60"
        >
          Show more (+{hiddenCount} team{hiddenCount === 1 ? "" : "s"})
        </button>
      )}

      {hasMore && expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="w-full border-t-2 border-amber-500 bg-seal-yellow/40 px-5 py-3 text-center font-mono text-sm font-bold text-amber-900 transition-colors hover:bg-seal-yellow/60"
        >
          Show less
        </button>
      )}
    </div>
  );
}

export function TeamsNeedingSupportPanel({ scope }: { scope: TeamsNeedingSupportScope }) {
  const { data: groups = [], isLoading } = useTeamsNeedingSupport(scope);
  const [showAllEvents, setShowAllEvents] = useState(false);

  if (isLoading) {
    return (
      <div className="mb-6 border-2 border-amber-500 bg-amber-50 p-5 shadow-[4px_4px_0_0_#0c1228]">
        <div className="h-24 animate-pulse rounded bg-seal-yellow/40" />
      </div>
    );
  }

  if (groups.length === 0) {
    return null;
  }

  const hasMoreEvents = groups.length > DEFAULT_EVENTS_VISIBLE;
  const visibleGroups = showAllEvents ? groups : groups.slice(0, DEFAULT_EVENTS_VISIBLE);
  const hiddenEvents = Math.max(0, groups.length - DEFAULT_EVENTS_VISIBLE);

  return (
    <div className="mb-6 space-y-4">
      {visibleGroups.map((group) => (
        <EventSupportCard key={group.eventId} group={group} />
      ))}

      {hasMoreEvents && !showAllEvents && (
        <button
          type="button"
          onClick={() => setShowAllEvents(true)}
          className="w-full border-2 border-amber-500 bg-seal-yellow/40 px-5 py-3 text-center font-mono text-sm font-bold text-amber-900 shadow-[4px_4px_0_0_#0c1228] transition-colors hover:bg-seal-yellow/60"
        >
          Show more competitions (+{hiddenEvents})
        </button>
      )}

      {hasMoreEvents && showAllEvents && (
        <button
          type="button"
          onClick={() => setShowAllEvents(false)}
          className="w-full border-2 border-amber-500 bg-seal-yellow/40 px-5 py-3 text-center font-mono text-sm font-bold text-amber-900 shadow-[4px_4px_0_0_#0c1228] transition-colors hover:bg-seal-yellow/60"
        >
          Show fewer competitions
        </button>
      )}
    </div>
  );
}
