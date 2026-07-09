"use client";

import { useMemo, useState } from "react";
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
const DEFAULT_TEAMS_PER_EVENT = 3;

function RiskBadge({ level }: { level: AtRiskTeamEntry["riskLevel"] }) {
  const isCritical = level === "CRITICAL";
  return (
    <span
      className="shrink-0 rounded px-2 py-1 text-xs font-bold"
      style={{
        color: isCritical ? "#be123c" : "#b45309",
        backgroundColor: isCritical ? "rgba(225,29,72,0.1)" : "rgba(245,158,11,0.2)",
      }}
    >
      {isCritical ? "Critical" : "At risk"}
    </span>
  );
}

function TeamProgressRow({ team }: { team: AtRiskTeamEntry }) {
  const msLeft = useRealtimeCountdown(team.submissionDeadline);

  return (
    <li className="flex items-center justify-between gap-4 border-t border-amber-200 bg-amber-50/70 px-5 py-3">
      <div>
        <p className="font-semibold text-navy">{team.teamName}</p>
        <p className="text-xs text-amber-900/70">
          {team.reasons.map(progressReasonLabel).join(" · ")} · {formatRealtimeDeadlineDetail(msLeft)}
        </p>
      </div>
      <RiskBadge level={team.riskLevel} />
    </li>
  );
}

function EventGroupSection({
  group,
  teamsLimit,
}: {
  group: EventAtRiskGroup;
  teamsLimit?: number;
}) {
  const visibleTeams = teamsLimit ? group.teams.slice(0, teamsLimit) : group.teams;
  const hiddenCount = teamsLimit ? Math.max(0, group.teams.length - teamsLimit) : 0;

  return (
    <section>
      <div className="border-t-2 border-amber-300 bg-amber-200/80 px-5 py-2.5">
        <h3 className="font-mono text-sm font-bold text-navy">{group.eventName}</h3>
      </div>
      <ul>
        {visibleTeams.map((team) => (
          <TeamProgressRow key={`${group.eventId}-${team.teamId}`} team={team} />
        ))}
      </ul>
      {hiddenCount > 0 && (
        <p className="border-t border-amber-200 bg-amber-50/50 px-5 py-2 text-xs text-amber-900/70">
          +{hiddenCount} more team{hiddenCount === 1 ? "" : "s"} in this competition
        </p>
      )}
    </section>
  );
}

export function TeamsNeedingSupportPanel({ scope }: { scope: TeamsNeedingSupportScope }) {
  const { data: groups = [], isLoading } = useTeamsNeedingSupport(scope);
  const [expanded, setExpanded] = useState(false);

  const totalTeams = useMemo(
    () => groups.reduce((sum, group) => sum + group.teams.length, 0),
    [groups],
  );

  const visibleGroups = useMemo(() => {
    if (expanded) return groups;
    return groups.slice(0, DEFAULT_EVENTS_VISIBLE);
  }, [expanded, groups]);

  const teamsLimit = expanded ? undefined : DEFAULT_TEAMS_PER_EVENT;
  const hiddenEvents = expanded ? 0 : Math.max(0, groups.length - DEFAULT_EVENTS_VISIBLE);
  const hasHiddenContent =
    !expanded &&
    (hiddenEvents > 0 ||
      groups.some((group) => group.teams.length > DEFAULT_TEAMS_PER_EVENT));

  if (isLoading) {
    return (
      <div className="mb-6 border-2 border-amber-300 bg-amber-50 p-5 shadow-[4px_4px_0_0_#0c1228]">
        <div className="h-24 animate-pulse rounded bg-amber-100/80" />
      </div>
    );
  }

  if (totalTeams === 0) {
    return null;
  }

  return (
    <div className="mb-6 border-2 border-amber-300 bg-amber-50 shadow-[4px_4px_0_0_#0c1228]">
      <div className="border-b-2 border-amber-200 px-5 py-3">
        <h2 className="font-mono text-lg font-bold text-navy">
          Teams needing support ({totalTeams})
        </h2>
        <p className="text-sm text-amber-900/80">
          Teams with slow submission progress before the round deadline.
        </p>
      </div>

      {visibleGroups.map((group) => (
        <EventGroupSection key={group.eventId} group={group} teamsLimit={teamsLimit} />
      ))}

      {hasHiddenContent && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full border-t-2 border-amber-300 bg-amber-200/80 px-5 py-3 text-center font-mono text-sm font-bold text-navy transition-colors hover:bg-amber-200"
        >
          Show more
        </button>
      )}

      {expanded && (groups.length > DEFAULT_EVENTS_VISIBLE ||
        groups.some((g) => g.teams.length > DEFAULT_TEAMS_PER_EVENT)) && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="w-full border-t-2 border-amber-300 bg-amber-200/80 px-5 py-3 text-center font-mono text-sm font-bold text-navy transition-colors hover:bg-amber-200"
        >
          Show less
        </button>
      )}
    </div>
  );
}
