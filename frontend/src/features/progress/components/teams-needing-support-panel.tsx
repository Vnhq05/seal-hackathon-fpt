"use client";

import { useState } from "react";
import { useTeamsNeedingSupport } from "@/features/progress/hooks/use-teams-needing-support";
import { useRealtimeCountdown } from "@/features/progress/hooks/use-realtime-countdown";
import {
  formatRealtimeDeadlineDetail,
  progressReasonLabel,
} from "@/features/progress/lib/progress.utils";
import type {
  AtRiskTeamEntry,
  EventAtRiskGroup,
  TeamsNeedingSupportScope,
} from "@/features/progress/types/progress-board.types";

const DEFAULT_EVENTS_VISIBLE = 2;
const DEFAULT_TEAMS_VISIBLE = 2;

function RiskBadge({ level }: { level: AtRiskTeamEntry["riskLevel"] }) {
  const isCritical = level === "CRITICAL";
  return (
    <span
      className="shrink-0 rounded px-2 py-1 text-xs font-bold"
      style={{
        color: isCritical ? "#93000a" : "#b45309",
        backgroundColor: isCritical ? "rgba(186,26,26,0.12)" : "rgba(245,158,11,0.2)",
      }}
    >
      {isCritical ? "Critical" : "At risk"}
    </span>
  );
}

function TeamProgressRow({ team }: { team: AtRiskTeamEntry }) {
  const msLeft = useRealtimeCountdown(team.submissionDeadline);

  if (msLeft !== null && msLeft <= 0) {
    return null;
  }

  return (
    <li className="flex items-center justify-between gap-4 border-t border-[#f5c2bc] bg-[#ffdad6]/70 px-5 py-3">
      <div>
        <p className="font-semibold text-navy">{team.teamName}</p>
        <p className="text-xs text-[#93000a]/70">
          {team.reasons.map(progressReasonLabel).join(" · ")} · {formatRealtimeDeadlineDetail(msLeft)}
        </p>
      </div>
      <RiskBadge level={team.riskLevel} />
    </li>
  );
}

function EventSupportCard({ group }: { group: EventAtRiskGroup }) {
  const [expanded, setExpanded] = useState(false);
  const deadlineMs = useRealtimeCountdown(group.teams[0]?.submissionDeadline);
  const openTeams =
    deadlineMs !== null && deadlineMs <= 0
      ? []
      : group.teams;

  if (openTeams.length === 0) {
    return null;
  }

  const teamCount = openTeams.length;
  const hasMore = teamCount > DEFAULT_TEAMS_VISIBLE;
  const visibleTeams = expanded ? openTeams : openTeams.slice(0, DEFAULT_TEAMS_VISIBLE);
  const hiddenCount = Math.max(0, teamCount - DEFAULT_TEAMS_VISIBLE);

  return (
    <div className="border-2 border-[#ba1a1a] bg-[#ffdad6] shadow-[4px_4px_0_0_#0c1228]">
      <div className="border-b-2 border-[#ba1a1a] bg-[#f5c2bc] px-5 py-2.5">
        <h2 className="font-mono text-sm font-bold text-[#93000a]">{group.eventName}</h2>
      </div>

      <div className="px-5 py-3">
        <h3 className="font-mono text-lg font-bold text-[#93000a]">
          Teams needing support ({teamCount})
        </h3>
        <p className="text-sm text-[#93000a]/80">
          Teams with slow submission progress before the round deadline.
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
          className="w-full border-t-2 border-[#ba1a1a] bg-[#f5c2bc] px-5 py-3 text-center font-mono text-sm font-bold text-[#93000a] transition-colors hover:bg-[#f0b0a8]"
        >
          Show more (+{hiddenCount} team{hiddenCount === 1 ? "" : "s"})
        </button>
      )}

      {hasMore && expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="w-full border-t-2 border-[#ba1a1a] bg-[#f5c2bc] px-5 py-3 text-center font-mono text-sm font-bold text-[#93000a] transition-colors hover:bg-[#f0b0a8]"
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
      <div className="mb-6 border-2 border-[#ba1a1a] bg-[#ffdad6] p-5 shadow-[4px_4px_0_0_#0c1228]">
        <div className="h-24 animate-pulse rounded bg-[#f5c2bc]/80" />
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
          className="w-full border-2 border-[#ba1a1a] bg-[#f5c2bc] px-5 py-3 text-center font-mono text-sm font-bold text-[#93000a] shadow-[4px_4px_0_0_#0c1228] transition-colors hover:bg-[#f0b0a8]"
        >
          Show more competitions (+{hiddenEvents})
        </button>
      )}

      {hasMoreEvents && showAllEvents && (
        <button
          type="button"
          onClick={() => setShowAllEvents(false)}
          className="w-full border-2 border-[#ba1a1a] bg-[#f5c2bc] px-5 py-3 text-center font-mono text-sm font-bold text-[#93000a] shadow-[4px_4px_0_0_#0c1228] transition-colors hover:bg-[#f0b0a8]"
        >
          Show fewer competitions
        </button>
      )}
    </div>
  );
}
