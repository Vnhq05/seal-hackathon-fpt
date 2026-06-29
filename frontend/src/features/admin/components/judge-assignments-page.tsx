"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignmentApi,
  eventApi,
  roundApi,
  trackApi,
  type EventResponse,
  type TeamAssignmentOverview,
  type EventJudgeOption,
  type RoundType,
} from "@/lib/api";
import {
  TEAM_ASSIGNMENTS_OVERVIEW_KEY,
  useTeamAssignmentsOverview,
} from "@/features/admin/hooks/use-admin-assignments";

const SEASONS = ["Spring", "Summer", "Fall", "Winter"] as const;

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month < 3) return "Spring";
  if (month < 6) return "Summer";
  if (month < 9) return "Fall";
  return "Winter";
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

function AssignJudgesModal({
  eventId,
  roundId,
  roundType,
  team,
  fallbackEligibleJudges,
  onClose,
}: {
  eventId: string;
  roundId: string;
  roundType: RoundType | undefined;
  team: TeamAssignmentOverview;
  fallbackEligibleJudges: EventJudgeOption[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isPreliminary = roundType === "PRELIMINARY";
  const initial = team.judges.map((j) => j.judgeUserId);
  const [j1, setJ1] = useState(initial[0] ?? "");
  const [j2, setJ2] = useState(initial[1] ?? "");
  const [j3, setJ3] = useState(initial[2] ?? "");
  const [error, setError] = useState<string | null>(null);

  const { data: trackJudges, isLoading: judgesLoading } = useQuery({
    queryKey: ["modal-eligible-judges", eventId, roundId, team.trackId],
    queryFn: () => assignmentApi.listJudges(eventId, roundId, team.trackId!),
    enabled: isPreliminary && !!team.trackId,
  });

  const eligibleJudges = useMemo(() => {
    if (isPreliminary && team.trackId) {
      return trackJudges ? toJudgeOptions(trackJudges) : [];
    }
    return fallbackEligibleJudges;
  }, [isPreliminary, team.trackId, trackJudges, fallbackEligibleJudges]);

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
  const cannotAssign = isPreliminary && !team.trackId;

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
            <option key={j.judgeUserId} value={j.judgeUserId} disabled={taken}>
              {j.judgeFullName ?? j.judgeEmail ?? j.judgeUserId}
              {isMentor ? " — MENTOR CONFLICT" : ""}
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
            disabled={isPending || judgesLoading || cannotAssign}
            className="border-2 border-navy bg-seal-yellow px-4 py-2 text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228] disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function JudgeAssignmentsPage() {
  const [season, setSeason] = useState(getCurrentSeason());
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [modalTeam, setModalTeam] = useState<TeamAssignmentOverview | null>(null);

  const { data: eventsPage, isLoading: eventsLoading } = useQuery({
    queryKey: ["assignment-events", season, year],
    queryFn: () => eventApi.list({ season, year, size: 100 }),
  });
  const events = eventsPage?.content ?? [];

  const { data: rounds = [] } = useQuery({
    queryKey: ["assignment-rounds", selectedEventId],
    queryFn: () => roundApi.list(selectedEventId),
    enabled: !!selectedEventId,
  });

  const { data: tracks = [] } = useQuery({
    queryKey: ["assignment-tracks", selectedEventId],
    queryFn: () => trackApi.list(selectedEventId),
    enabled: !!selectedEventId,
  });

  const { data: overview, isLoading: overviewLoading } = useTeamAssignmentsOverview(
    selectedEventId,
    {
      roundId: selectedRoundId,
      season,
      year,
      trackId: selectedTrackId || undefined,
    },
  );

  const selectedEvent = events.find((e: EventResponse) => e.id === selectedEventId);
  const selectedRound = rounds.find((r) => r.id === selectedRoundId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-seal-text">Judge assignments</h1>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Each team needs exactly 3 judges per round. Judges cannot be the team's mentor.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={season}
          onChange={(e) => { setSeason(e.target.value); setSelectedEventId(""); }}
          className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm"
        >
          {SEASONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => { setYear(Number(e.target.value)); setSelectedEventId(""); }}
          className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm"
        >
          {[year - 1, year, year + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={selectedEventId}
          onChange={(e) => {
            setSelectedEventId(e.target.value);
            setSelectedRoundId("");
            setSelectedTrackId("");
          }}
          className="min-w-[220px] border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm"
        >
          <option value="">Select event...</option>
          {events.map((e: EventResponse) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        {selectedEvent && tracks.length > 0 && (
          <select
            value={selectedTrackId}
            onChange={(e) => setSelectedTrackId(e.target.value)}
            className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm"
          >
            <option value="">All tracks</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
        {selectedEventId && (
          <select
            value={selectedRoundId}
            onChange={(e) => setSelectedRoundId(e.target.value)}
            className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm"
          >
            <option value="">Select round...</option>
            {rounds.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        )}
      </div>

      {eventsLoading && (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-seal-cyan border-t-transparent" />
        </div>
      )}

      {!eventsLoading && events.length === 0 && (
        <p className="text-sm text-seal-text-muted">No events for {season} {year}.</p>
      )}

      {selectedEventId && selectedRoundId && (
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
                  <th className="px-4 py-3 w-32" />
                </tr>
              </thead>
              <tbody>
                {(overview?.teams ?? []).map((team) => (
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
                      <button
                        type="button"
                        onClick={() => setModalTeam(team)}
                        className="border-2 border-navy bg-seal-yellow px-3 py-1.5 text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228]"
                      >
                        Assign
                      </button>
                    </td>
                  </tr>
                ))}
                {(overview?.teams ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-seal-text-muted">
                      No teams found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedEventId && !selectedRoundId && (
        <p className="text-sm text-seal-text-muted">Select a round to view the team list.</p>
      )}

      {modalTeam && overview && (
        <AssignJudgesModal
          eventId={selectedEventId}
          roundId={selectedRoundId}
          roundType={selectedRound?.roundType ?? undefined}
          team={modalTeam}
          fallbackEligibleJudges={overview.eligibleJudges}
          onClose={() => setModalTeam(null)}
        />
      )}
    </div>
  );
}
