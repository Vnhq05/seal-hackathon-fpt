"use client";

import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  assignmentApi,
  eventApi,
  roundApi,
  trackApi,
  type EventResponse,
  type EventStatus,
  type TeamAssignmentOverview,
  type EventJudgeOption,
  type RoundType,
  type RoundResponse,
  type TrackResponse,
} from "@/lib/api";
import {
  TEAM_ASSIGNMENTS_OVERVIEW_KEY,
  useAssignJudge,
  useEventStaffJudges,
  useJudgeAssignments,
  useRemoveJudge,
  useTeamAssignmentsOverview,
} from "@/features/admin/hooks/use-admin-assignments";

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

function toJudgeOptions(
  judges: Awaited<ReturnType<typeof assignmentApi.listJudges>>,
): EventJudgeOption[] {
  return judges.map((j) => ({
    id: j.id,
    judgeUserId: j.judgeUserId,
    judgeFullName: j.judgeFullName,
    judgeEmail: j.judgeEmail,
  }));
}

function resolveJudgePoolTrackId(
  roundType: RoundType | undefined,
  panelTrackId: string,
  teamTrackId?: string | null,
): { poolTrackId: string | undefined; requiresTrackId: boolean } {
  const isPreliminary = roundType === "PRELIMINARY";
  if (!isPreliminary) {
    return { poolTrackId: undefined, requiresTrackId: false };
  }
  const trackId = teamTrackId ?? (panelTrackId || undefined);
  return { poolTrackId: trackId, requiresTrackId: true };
}

function AssignJudgesModal({
  eventId,
  roundId,
  roundType,
  selectedTrackId,
  team,
  onClose,
}: {
  eventId: string;
  roundId: string;
  roundType: RoundType | undefined;
  selectedTrackId: string;
  team: TeamAssignmentOverview;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isPreliminary = roundType === "PRELIMINARY";
  const { poolTrackId, requiresTrackId } = resolveJudgePoolTrackId(
    roundType,
    selectedTrackId,
    team.trackId,
  );
  const initial = team.judges.map((j) => j.judgeUserId);
  const [j1, setJ1] = useState(initial[0] ?? "");
  const [j2, setJ2] = useState(initial[1] ?? "");
  const [j3, setJ3] = useState(initial[2] ?? "");
  const [error, setError] = useState<string | null>(null);

  const { data: poolJudges, isLoading: judgesLoading } = useJudgeAssignments(
    eventId,
    roundId,
    poolTrackId,
    { requiresTrackId },
  );

  const eligibleJudges = useMemo(
    () => (poolJudges ? toJudgeOptions(poolJudges) : []),
    [poolJudges],
  );

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      assignmentApi.assignTeamJudges({
        eventId,
        roundId,
        teamId: team.teamId,
        judgeUserIds: [j1, j2, j3],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TEAM_ASSIGNMENTS_OVERVIEW_KEY] });
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  const selected = new Set([j1, j2, j3].filter(Boolean));
  const cannotAssign = isPreliminary && !poolTrackId;
  const noEligibleJudges =
    !cannotAssign && !judgesLoading && eligibleJudges.length === 0;

  const renderSelect = (value: string, onChange: (v: string) => void, label: string) => (
    <div>
      <label className="mb-1 block text-xs font-medium text-seal-text-secondary">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={judgesLoading || cannotAssign}
        className="w-full border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm outline-none focus:border-royal/40 disabled:opacity-50"
      >
        <option value="">Select judge...</option>
        {eligibleJudges.map((j) => {
          const isMentor = team.mentorUserId === j.judgeUserId;
          const taken = selected.has(j.judgeUserId) && j.judgeUserId !== value;
          return (
            <option key={j.judgeUserId} value={j.judgeUserId} disabled={taken || isMentor}>
              {j.judgeFullName ?? j.judgeEmail ?? j.judgeUserId}
              {isMentor ? " — MENTOR CONFLICT (cannot assign)" : ""}
            </option>
          );
        })}
      </select>
      {value && team.mentorUserId === value && (
        <p className="mt-1 text-xs font-medium text-red-600">
          Warning: This judge is the mentor of team {team.teamName}
        </p>
      )}
    </div>
  );

  const handleSubmit = () => {
    setError(null);
    if (cannotAssign) {
      setError("Team has no track — cannot assign preliminary judges");
      return;
    }
    if (!j1 || !j2 || !j3) {
      setError("Please select all 3 judges");
      return;
    }
    if (new Set([j1, j2, j3]).size !== 3) {
      setError("All 3 judges must be different");
      return;
    }
    if ([j1, j2, j3].some((id) => id === team.mentorUserId)) {
      setError("Cannot assign the team's mentor as a judge");
      return;
    }
    mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-seal-text">Assign judges</h2>
        <p className="mt-1 text-sm text-seal-text-muted">
          {team.teamName} — select exactly 3 judges
        </p>
        {team.mentorFullName && (
          <p className="mt-2 text-xs text-seal-text-secondary">
            Mentor: {team.mentorFullName}
          </p>
        )}
        {cannotAssign && (
          <p className="mt-2 text-xs font-medium text-red-600">
            Team has no track assigned. Please assign a track before assigning judges.
          </p>
        )}
        {noEligibleJudges && (
          <p className="mt-2 text-xs font-medium text-amber-700">
            No judges in the pool for this round yet. Close this dialog and add judges in the Judge
            pool section above.
          </p>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {renderSelect(j1, setJ1, "Judge 1")}
          {renderSelect(j2, setJ2, "Judge 2")}
          {renderSelect(j3, setJ3, "Judge 3")}
        </div>

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="border-2 border-navy bg-white px-4 py-2 text-sm font-medium text-seal-text"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || judgesLoading || cannotAssign || noEligibleJudges}
            className="border-2 border-navy bg-seal-yellow px-4 py-2 text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228] disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}

function JudgePoolRow({
  eventId,
  roundId,
  poolTrackId,
  judgeId,
  judgeFullName,
  judgeEmail,
}: {
  eventId: string;
  roundId: string;
  poolTrackId: string | undefined;
  judgeId: string;
  judgeFullName: string | null;
  judgeEmail: string | null;
}) {
  const { mutate: remove } = useRemoveJudge(eventId, roundId, poolTrackId);

  return (
    <tr className="border-t border-seal-border">
      <td className="px-4 py-3 text-sm font-medium text-seal-text">
        {judgeFullName ?? "Unknown"}
      </td>
      <td className="px-4 py-3 text-sm text-seal-text-secondary">{judgeEmail ?? "—"}</td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={() => remove(judgeId)}
          className="text-xs font-semibold text-red-700 hover:underline"
        >
          Remove
        </button>
      </td>
    </tr>
  );
}

function JudgePoolSection({
  eventId,
  roundId,
  roundType,
  selectedTrackId,
}: {
  eventId: string;
  roundId: string;
  roundType: RoundType | undefined;
  selectedTrackId: string;
}) {
  const { poolTrackId, requiresTrackId } = resolveJudgePoolTrackId(roundType, selectedTrackId);
  const isPreliminary = roundType === "PRELIMINARY";
  const [judgeUserId, setJudgeUserId] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);

  const { data: poolJudges = [], isLoading: poolLoading } = useJudgeAssignments(
    eventId,
    roundId,
    poolTrackId,
    { requiresTrackId },
  );
  const { data: eventJudges = [] } = useEventStaffJudges(eventId);
  const { mutate: assign, isPending } = useAssignJudge(eventId, roundId);

  const pooledUserIds = useMemo(
    () => new Set(poolJudges.map((j) => j.judgeUserId)),
    [poolJudges],
  );
  const availableJudges = useMemo(
    () => eventJudges.filter((j) => !pooledUserIds.has(j.userId)),
    [eventJudges, pooledUserIds],
  );

  const handleAdd = () => {
    if (!judgeUserId) return;
    setAssignError(null);
    assign(
      { judgeUserId, ...(isPreliminary ? { trackId: selectedTrackId } : {}) },
      {
        onSuccess: () => setJudgeUserId(""),
        onError: (err: Error) => setAssignError(err.message),
      },
    );
  };

  return (
    <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-4">
      <h3 className="text-sm font-bold text-seal-text">Judge pool</h3>
      <p className="mt-1 text-xs text-seal-text-muted">
        Judges added here are available when assigning teams in this round.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-seal-text-secondary">
            Add to pool
          </label>
          <select
            value={judgeUserId}
            onChange={(e) => setJudgeUserId(e.target.value)}
            className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm"
          >
            <option value="">Select judge...</option>
            {availableJudges.map((j) => (
              <option key={j.userId} value={j.userId}>
                {j.fullName ?? j.email}
              </option>
            ))}
          </select>
          {eventJudges.length === 0 && (
            <p className="mt-1 text-xs font-medium text-amber-700">
              No judges on the event roster. Add judges in the event&apos;s Add Lecture tab first.
            </p>
          )}
        </div>
        {assignError && <p className="text-xs text-red-600">{assignError}</p>}
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending || !judgeUserId}
          className="border-2 border-navy bg-seal-yellow px-4 py-2 text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228] disabled:opacity-50"
        >
          {isPending ? "Adding..." : "Add"}
        </button>
      </div>

      <div className="mt-4 overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        {poolLoading ? (
          <div className="flex justify-center p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-seal-cyan border-t-transparent" />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-seal-surface-elevated text-xs font-semibold uppercase tracking-wider text-seal-text-muted">
              <tr>
                <th className="px-4 py-3">Judge</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {poolJudges.map((j) => (
                <JudgePoolRow
                  key={j.id}
                  eventId={eventId}
                  roundId={roundId}
                  poolTrackId={poolTrackId}
                  judgeId={j.id}
                  judgeFullName={j.judgeFullName}
                  judgeEmail={j.judgeEmail}
                />
              ))}
              {poolJudges.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-seal-text-muted">
                    No judges in the pool for this round yet.
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
  onAssignTeam,
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
  onAssignTeam: (team: TeamAssignmentOverview) => void;
}) {
  const selectedRound = rounds.find((r) => r.id === selectedRoundId);
  const roundType = selectedRound?.roundType ?? undefined;
  const isPreliminary = roundType === "PRELIMINARY";
  const showPool = !!selectedRoundId && (!isPreliminary || !!selectedTrackId);
  const needsTrackForPool = !!selectedRoundId && isPreliminary && !selectedTrackId;

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
                  <th className="px-4 py-3">Submission</th>
                  <th className="px-4 py-3">Judge</th>
                  <th className="px-4 py-3">COI</th>
                  <th className="px-4 py-3 w-32" />
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
                        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          team.submissionStatus
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}>
                          {team.submissionStatus ?? "Not submitted"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-seal-text-secondary">
                        {team.judgeCount}/3
                        {team.judges.length > 0 && (
                          <div className="mt-1 text-xs text-seal-text-muted">
                            {team.judges.map((j) => j.judgeFullName).join(", ")}
                          </div>
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
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => onAssignTeam(team)}
                          className="border-2 border-navy bg-seal-yellow px-3 py-1.5 text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228]"
                        >
                          Assign
                        </button>
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
  const [season, setSeason] = useState(getCurrentSeason());
  const [year, setYear] = useState(new Date().getFullYear());
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [modalTeam, setModalTeam] = useState<TeamAssignmentOverview | null>(null);

  const resetAssignment = () => {
    setExpandedEventId(null);
    setSelectedTrackId("");
    setSelectedRoundId("");
    setModalTeam(null);
  };

  const resetTrackRound = () => {
    setSelectedTrackId("");
    setSelectedRoundId("");
    setModalTeam(null);
  };

  const handleToggleAssignment = (eventId: string) => {
    if (expandedEventId === eventId) {
      resetAssignment();
      return;
    }
    setExpandedEventId(eventId);
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

  const selectedRound = rounds.find((r) => r.id === selectedRoundId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-seal-text">Judge assignments</h1>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Each team needs exactly 3 judges per round. Judges cannot be the team mentor.
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
                          onAssignTeam={setModalTeam}
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

      {modalTeam && expandedEventId && selectedRoundId && (
        <AssignJudgesModal
          eventId={expandedEventId}
          roundId={selectedRoundId}
          roundType={selectedRound?.roundType ?? undefined}
          selectedTrackId={selectedTrackId}
          team={modalTeam}
          onClose={() => setModalTeam(null)}
        />
      )}
    </div>
  );
}
