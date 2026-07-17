"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { StaffAssignmentNav } from "@/shared/components/staff-assignment-nav";
import { useStaffPortalBase } from "@/shared/hooks/use-staff-portal-base";
import {
  eventApi,
  roundApi,
  trackApi,
  type EventResponse,
  type EventStatus,
  type RoundType,
  type RoundResponse,
  type TrackResponse,
} from "@/lib/api";
import {
  useAssignJudge,
  useCompetitionGroups,
  useEventStaffJudges,
  useJudgeAssignments,
  useJudgeWorkloadPreview,
  useRemoveJudge,
  useTeamAssignmentsOverview,
  useUpdateTeamGroup,
} from "@/features/admin/hooks/use-admin-assignments";
import type { AssignmentScope, JudgeAssignmentResponse } from "@/lib/api/assignment.api";

const SEASONS = ["Spring", "Summer", "Fall", "Winter"] as const;

const STATUS_STYLES: Record<EventStatus, { backgroundColor: string; color: string }> = {
  UPCOMING: { backgroundColor: "#f0f9ff", color: "#0369a1" },
  OPEN: { backgroundColor: "#e0f2fe", color: "#0284c7" },
  CLOSED_REGISTRATION: { backgroundColor: "#fef3c7", color: "#b45309" },
  ACTIVE: { backgroundColor: "#dcfce7", color: "#166534" },
  SCORING: { backgroundColor: "#ede9fe", color: "#6d28d9" },
  COMPLETED: { backgroundColor: "#eef0f6", color: "#8891a5" },
  CANCELLED: { backgroundColor: "#fef2f2", color: "#991b1b" },
};

const STATUS_LABELS: Record<EventStatus, string> = {
  UPCOMING: "Upcoming",
  OPEN: "Open",
  CLOSED_REGISTRATION: "Registration Closed",
  ACTIVE: "Active",
  SCORING: "Scoring",
  COMPLETED: "Closed",
  CANCELLED: "Cancelled",
};

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month < 3) return "Spring";
  if (month < 6) return "Summer";
  if (month < 9) return "Fall";
  return "Winter";
}

function EventStatusBadge({ status }: { status: EventStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: style.backgroundColor, color: style.color }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const MIN_JUDGES_PER_SCOPE = 2;

function TeamGroupCell({
  eventId,
  teamId,
  trackId,
  groupId,
}: {
  eventId: string;
  teamId: string;
  trackId: string | null;
  groupId?: string | null;
}) {
  const { data: groups = [] } = useCompetitionGroups(eventId, trackId ?? "");
  const { mutate: updateGroup, isPending } = useUpdateTeamGroup(eventId);
  const [warning, setWarning] = useState<string | null>(null);

  if (!trackId) {
    return <span className="text-sm text-seal-text-muted">—</span>;
  }

  if (groups.length === 0) {
    return <span className="text-sm text-seal-text-muted">{groupId ? "—" : "No groups"}</span>;
  }

  return (
    <div>
      <select
        value={groupId ?? ""}
        onChange={(e) => {
          const next = e.target.value || null;
          setWarning(null);
          updateGroup(
            { teamId, groupId: next },
            {
              onSuccess: (res) => {
                if (res.warning) setWarning(res.warning);
              },
            },
          );
        }}
        disabled={isPending}
        className="border border-seal-border bg-white px-2 py-1 text-sm"
      >
        <option value="" disabled>Select group...</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>
      {warning && (
        <p className="mt-1 text-xs font-medium text-amber-700">{warning}</p>
      )}
    </div>
  );
}

function JudgePoolRow({
  eventId,
  roundId,
  assignment,
}: {
  eventId: string;
  roundId: string;
  assignment: JudgeAssignmentResponse;
}) {
  const { mutate: remove, isPending: isRemoving } = useRemoveJudge(eventId, roundId);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const handleRemove = () => {
    const label = assignment.judgeFullName ?? assignment.judgeEmail ?? "this judge";
    if (!window.confirm(`Remove ${label} from the judge pool?`)) return;
    setRemoveError(null);
    remove(assignment.id, {
      onError: (err: Error) => setRemoveError(err.message),
    });
  };

  return (
    <tr className="border-t border-seal-border">
      <td className="px-4 py-3 text-sm font-medium text-seal-text">
        {assignment.judgeFullName ?? "Unknown"}
        {assignment.conflictRisk && (
          <span className="ml-2 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
            COI
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-seal-text-secondary">{assignment.judgeEmail ?? "—"}</td>
      <td className="px-4 py-3 text-xs text-seal-text-secondary">{assignment.scope}</td>
      <td className="px-4 py-3 text-xs text-seal-text-secondary">{assignment.groupName ?? "—"}</td>
      <td className="px-4 py-3 text-xs">
        <span className={assignment.active ? "text-emerald-700" : "text-amber-700"}>
          {assignment.active ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-seal-text-secondary">
        {assignment.expectedSubmissionCount ?? "—"}
      </td>
      <td className="px-4 py-3 text-xs text-seal-text-muted">
        {new Date(assignment.assignedAt).toLocaleString()}
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={handleRemove}
          disabled={isRemoving}
          className="text-xs text-red-700 hover:underline disabled:opacity-50"
        >
          {isRemoving ? "Removing..." : "Remove"}
        </button>
        {removeError && (
          <p className="mt-1 max-w-[14rem] text-xs text-red-600">{removeError}</p>
        )}
      </td>
    </tr>
  );
}

function JudgePoolSection({
  eventId,
  roundId,
  roundType,
  selectedTrackId,
  minJudgesRequired,
  portalBase,
  ungroupedTeamNames,
}: {
  eventId: string;
  roundId: string;
  roundType: RoundType | undefined;
  selectedTrackId: string;
  minJudgesRequired: number;
  portalBase: string;
  ungroupedTeamNames: string[];
}) {
  const isFinal = roundType === "FINAL";
  const isPreliminary = roundType === "PRELIMINARY";
  const [scope, setScope] = useState<AssignmentScope>(isFinal ? "ROUND" : "TRACK");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [judgeUserId, setJudgeUserId] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignWarning, setAssignWarning] = useState<string | null>(null);

  const trackIdForScope = scope === "ROUND" ? undefined : selectedTrackId || undefined;
  const { data: groups = [] } = useCompetitionGroups(eventId, selectedTrackId);
  const { data: poolJudges = [], isLoading: poolLoading } = useJudgeAssignments(eventId, roundId, {
    trackId: trackIdForScope,
    groupId: scope === "GROUP" ? selectedGroupId || undefined : undefined,
    requiresTrackId: isPreliminary && scope !== "ROUND",
  });
  const { data: workload } = useJudgeWorkloadPreview(
    eventId,
    roundId,
    scope,
    trackIdForScope,
    scope === "GROUP" ? selectedGroupId || undefined : undefined,
  );
  const { data: eventJudges = [] } = useEventStaffJudges(eventId);
  const { mutate: assign, isPending } = useAssignJudge(eventId, roundId);

  const activeJudgeCount = poolJudges.filter((j) => j.active).length;
  const incompleteFromApi = poolJudges[0]?.incompleteScopes ?? [];

  const pooledUserIds = useMemo(
    () => new Set(poolJudges.filter((j) => j.active).map((j) => j.judgeUserId)),
    [poolJudges],
  );
  const availableJudges = useMemo(
    () => eventJudges.filter((j) => !pooledUserIds.has(j.userId)),
    [eventJudges, pooledUserIds],
  );

  const canAssign =
    !!judgeUserId &&
    ungroupedTeamNames.length === 0 &&
    (scope === "ROUND" || (!!selectedTrackId && (scope !== "GROUP" || !!selectedGroupId)));

  const handleAdd = () => {
    if (!canAssign) return;
    setAssignError(null);
    setAssignWarning(null);
    assign(
      {
        judgeUserId,
        scope,
        ...(scope !== "ROUND" ? { trackId: selectedTrackId } : {}),
        ...(scope === "GROUP" ? { groupId: selectedGroupId } : {}),
      },
      {
        onSuccess: (data) => {
          setJudgeUserId("");
          if (data.warning) setAssignWarning(data.warning);
        },
        onError: (err: Error) => setAssignError(err.message),
      },
    );
  };

  return (
    <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-bold text-seal-text">Judge pool</h3>
        {activeJudgeCount < minJudgesRequired && (
          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            Not enough judges (minimum {minJudgesRequired})
          </span>
        )}
        {incompleteFromApi.map((s) => (
          <span key={`${s.scope}-${s.trackId}-${s.groupId}`} className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            INCOMPLETE: {s.trackName ?? s.scope} {s.groupName ? `/ ${s.groupName}` : ""}
          </span>
        ))}
      </div>
      <p className="mt-1 text-xs text-seal-text-muted">
        Assign judges by scope — they automatically score all teams in that scope.
      </p>
      {ungroupedTeamNames.length > 0 && (
        <div className="mt-3 border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Assign every team to a competition group before adding judges. Missing:{" "}
          <span className="font-semibold">{ungroupedTeamNames.join(", ")}</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-seal-text-secondary">Scope</label>
          <select
            value={scope}
            onChange={(e) => {
              setScope(e.target.value as AssignmentScope);
              setSelectedGroupId("");
            }}
            disabled={isFinal}
            className="border-2 border-navy bg-white px-3 py-2 text-sm"
          >
            <option value="ROUND">Whole round</option>
            {!isFinal && <option value="TRACK">Track</option>}
            {!isFinal && <option value="GROUP">Group</option>}
          </select>
        </div>
        {scope === "GROUP" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-seal-text-secondary">Group</label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              disabled={!selectedTrackId}
              className="border-2 border-navy bg-white px-3 py-2 text-sm"
            >
              <option value="">Select group...</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-seal-text-secondary">Add judge</label>
          <select
            value={judgeUserId}
            onChange={(e) => setJudgeUserId(e.target.value)}
            className="border-2 border-navy bg-white px-3 py-2 text-sm"
            disabled={eventJudges.length === 0 || ungroupedTeamNames.length > 0}
          >
            <option value="">Select judge...</option>
            {availableJudges.map((j) => (
              <option key={j.userId} value={j.userId}>{j.fullName ?? j.email}</option>
            ))}
          </select>
          {eventJudges.length === 0 && (
            <p className="mt-1 text-xs text-amber-700">
              No judges in the roster yet. Add them at{" "}
              <Link
                href={`${portalBase}/hackathons/${eventId}?tab=lecture`}
                className="font-semibold underline"
              >
                Event → Add Lecture
              </Link>
              .
            </p>
          )}
        </div>
        {workload && (
          <p className="text-xs text-seal-text-secondary">
            Preview: {workload.teamCount} teams, {workload.submissionCount} submissions
          </p>
        )}
        {assignError && <p className="text-xs text-red-600">{assignError}</p>}
        {assignWarning && <p className="text-xs text-amber-700">{assignWarning}</p>}
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending || !canAssign}
          className="border-2 border-navy bg-seal-yellow px-4 py-2 text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228] disabled:opacity-50"
        >
          {isPending ? "Adding..." : "Add"}
        </button>
      </div>

      <div className="mt-4 overflow-x-auto border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        {poolLoading ? (
          <div className="flex justify-center p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-seal-cyan border-t-transparent" />
          </div>
        ) : (
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-seal-surface-elevated text-xs font-semibold uppercase tracking-wider text-seal-text-muted">
              <tr>
                <th className="px-4 py-3">Judge</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submissions</th>
                <th className="px-4 py-3">Assigned</th>
                <th className="px-4 py-3 w-40" />
              </tr>
            </thead>
            <tbody>
              {poolJudges.map((j) => (
                <JudgePoolRow
                  key={j.id}
                  eventId={eventId}
                  roundId={roundId}
                  assignment={j}
                />
              ))}
              {poolJudges.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-seal-text-muted">
                    No judges in the pool for this scope yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function EventAssignmentPanel({
  eventId,
  tracks,
  rounds,
  selectedTrackId,
  selectedRoundId,
  onTrackChange,
  onRoundChange,
  overview,
  overviewLoading,
  portalBase,
}: {
  eventId: string;
  tracks: TrackResponse[];
  rounds: RoundResponse[];
  selectedTrackId: string;
  selectedRoundId: string;
  onTrackChange: (trackId: string) => void;
  onRoundChange: (roundId: string) => void;
  overview: ReturnType<typeof useTeamAssignmentsOverview>["data"];
  overviewLoading: boolean;
  portalBase: string;
}) {
  const selectedRound = rounds.find((r) => r.id === selectedRoundId);
  const roundType = selectedRound?.roundType ?? undefined;
  const isPreliminary = roundType === "PRELIMINARY";
  const showPool = !!selectedRoundId;
  const needsTrackForPool = !!selectedRoundId && isPreliminary && !selectedTrackId;
  const ungroupedTeamNames = (overview?.teams ?? [])
    .filter((team) => team.groupId == null)
    .map((team) => team.teamName);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        {tracks.length > 0 && (
          <select
            value={selectedTrackId}
            onChange={(e) => onTrackChange(e.target.value)}
            className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm"
          >
            <option value="">All tracks</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
        <select
          value={selectedRoundId}
          onChange={(e) => onRoundChange(e.target.value)}
          className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm"
        >
          <option value="">Select round...</option>
          {rounds.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {!selectedRoundId && (
        <p className="text-sm text-seal-text-muted">Select a round to view the team list.</p>
      )}

      {needsTrackForPool && (
        <p className="text-sm text-seal-text-muted">
          Select a specific track to manage the judge pool.
        </p>
      )}

      {showPool && (
        <JudgePoolSection
          eventId={eventId}
          roundId={selectedRoundId}
          roundType={roundType}
          selectedTrackId={selectedTrackId}
          minJudgesRequired={selectedRound?.minJudgesPerRound ?? MIN_JUDGES_PER_SCOPE}
          portalBase={portalBase}
          ungroupedTeamNames={ungroupedTeamNames}
        />
      )}

      {selectedRoundId && (
        <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
          {overviewLoading ? (
            <div className="flex justify-center p-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-seal-cyan border-t-transparent" />
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-seal-surface-elevated text-xs font-semibold uppercase tracking-wider text-seal-text-muted">
                <tr>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Track</th>
                  <th className="px-4 py-3">Group</th>
                  <th className="px-4 py-3">Submission</th>
                  <th className="px-4 py-3">Judges (pool)</th>
                  <th className="px-4 py-3">COI</th>
                </tr>
              </thead>
              <tbody>
                {(overview?.teams ?? []).map((team) => {
                  const hasCoiRisk =
                    team.mentorUserId != null &&
                    team.judges.some((j) => j.judgeUserId === team.mentorUserId);
                  return (
                    <tr key={team.teamId} className="border-t border-seal-border">
                      <td className="px-4 py-3 text-sm font-medium text-seal-text">{team.teamName}</td>
                      <td className="px-4 py-3 text-sm text-seal-text-secondary">{team.trackName ?? "—"}</td>
                      <td className="px-4 py-3">
                        <TeamGroupCell
                          eventId={eventId}
                          teamId={team.teamId}
                          trackId={team.trackId}
                          groupId={team.groupId}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          team.submissionStatus
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}>
                          {team.submissionStatus ?? "Not submitted"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-seal-text-secondary">
                        {team.judgeCount === 0 ? (
                          <span className="text-seal-text-muted">No judges in pool</span>
                        ) : (
                          <>
                            <span className="font-medium">{team.judgeCount}</span>
                            <div className="mt-1 text-xs text-seal-text-muted">
                              {team.judges.map((j) => j.judgeFullName ?? j.judgeUserId).join(", ")}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {hasCoiRisk ? (
                          <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                            COI Risk
                          </span>
                        ) : (
                          <span className="text-sm text-seal-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {(overview?.teams ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-seal-text-muted">
                      No teams found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function EventsTableSkeleton() {
  return (
    <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
      <table className="w-full text-left">
        <thead className="bg-seal-surface-elevated text-xs font-semibold uppercase tracking-wider text-seal-text-muted">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3 w-36">Status</th>
            <th className="px-4 py-3 w-24">Tracks</th>
            <th className="px-4 py-3 w-40" />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 4 }).map((_, i) => (
            <tr key={i} className="border-t border-seal-border">
              {Array.from({ length: 4 }).map((__, j) => (
                <td key={j} className="px-4 py-3">
                  <div className="h-4 w-3/5 animate-pulse rounded bg-seal-border/60" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function JudgeAssignmentsPage() {
  const userEmail = useAuthStore((s) => s.user?.email);
  const portalBase = useStaffPortalBase();
  const searchParams = useSearchParams();
  const urlEventId = searchParams.get("eventId");
  const [season, setSeason] = useState(getCurrentSeason());
  const [year, setYear] = useState(new Date().getFullYear());
  const [manualExpandedEventId, setManualExpandedEventId] = useState<string | null | false>(false);
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");

  const resetAssignment = () => {
    setManualExpandedEventId(null);
    setSelectedTrackId("");
    setSelectedRoundId("");
  };

  const resetTrackRound = () => {
    setSelectedTrackId("");
    setSelectedRoundId("");
  };

  const handleToggleAssignment = (eventId: string) => {
    if (expandedEventId === eventId) {
      resetAssignment();
      return;
    }
    setManualExpandedEventId(eventId);
    resetTrackRound();
  };

  const handleSeasonChange = (value: string) => {
    setSeason(value);
    resetAssignment();
  };

  const handleYearChange = (value: number) => {
    setYear(value);
    resetAssignment();
  };

  const { data: eventsPage, isLoading: eventsLoading } = useQuery({
    queryKey: ["assignment-events", season, year, userEmail],
    queryFn: () => eventApi.list({ season, year, size: 100 }),
  });
  const events = eventsPage?.content ?? [];
  const urlDefaultExpandedEventId =
    urlEventId && events.some((event) => event.id === urlEventId) ? urlEventId : null;
  const expandedEventId =
    manualExpandedEventId === false ? urlDefaultExpandedEventId : manualExpandedEventId;

  const { data: rounds = [] } = useQuery({
    queryKey: ["assignment-rounds", expandedEventId, userEmail],
    queryFn: () => roundApi.list(expandedEventId!),
    enabled: !!expandedEventId,
  });

  const { data: tracks = [] } = useQuery({
    queryKey: ["assignment-tracks", expandedEventId, userEmail],
    queryFn: () => trackApi.list(expandedEventId!),
    enabled: !!expandedEventId,
  });

  const { data: overview, isLoading: overviewLoading } = useTeamAssignmentsOverview(
    expandedEventId ?? "",
    {
      roundId: selectedRoundId,
      season,
      year,
      trackId: selectedTrackId || undefined,
    },
  );

  return (
    <div className="flex flex-col gap-6">
      <StaffAssignmentNav />

      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-seal-text">Judge assignments</h1>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Assign judges to a round or track — they automatically score all teams in that scope.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={season}
          onChange={(e) => handleSeasonChange(e.target.value)}
          className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm"
        >
          {SEASONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => handleYearChange(Number(e.target.value))}
          className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm"
        >
          {[year - 1, year, year + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {eventsLoading && <EventsTableSkeleton />}

      {!eventsLoading && events.length === 0 && (
        <p className="text-sm text-seal-text-muted">No events for {season} {year}.</p>
      )}

      {!eventsLoading && events.length > 0 && (
        <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
          <table className="w-full text-left">
            <thead className="bg-seal-surface-elevated text-xs font-semibold uppercase tracking-wider text-seal-text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 w-36">Status</th>
                <th className="px-4 py-3 w-24">Tracks</th>
                <th className="px-4 py-3 w-40" />
              </tr>
            </thead>
            <tbody>
              {events.map((event: EventResponse) => (
                <Fragment key={event.id}>
                  <tr className="border-t border-seal-border">
                    <td className="px-4 py-3 text-sm font-medium text-seal-text">{event.name}</td>
                    <td className="px-4 py-3">
                      <EventStatusBadge status={event.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-seal-text-secondary">{event.trackCount}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleAssignment(event.id)}
                        className="border-2 border-navy bg-seal-yellow px-3 py-1.5 text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228]"
                      >
                        {expandedEventId === event.id ? "Close" : "Add Assignment"}
                      </button>
                    </td>
                  </tr>
                  {expandedEventId === event.id && (
                    <tr className="border-t border-seal-border bg-seal-surface-elevated/30">
                      <td colSpan={4} className="px-4 py-4">
                        <EventAssignmentPanel
                          eventId={event.id}
                          tracks={tracks}
                          rounds={rounds}
                          selectedTrackId={selectedTrackId}
                          selectedRoundId={selectedRoundId}
                          onTrackChange={setSelectedTrackId}
                          onRoundChange={setSelectedRoundId}
                          overview={overview}
                          overviewLoading={overviewLoading}
                          portalBase={portalBase}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
