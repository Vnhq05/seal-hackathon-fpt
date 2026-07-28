"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { StaffAssignmentNav } from "@/shared/components/staff-assignment-nav";
import { AssignmentWorkflowBanner } from "@/shared/components/assignment-workflow-banner";
import { useAdminEvents } from "@/features/admin/hooks/use-admin-hackathons";
import { useAdminRounds } from "@/features/admin/hooks/use-admin-rounds";
import {
  useJudgeAssignments,
  useMentorAssignments,
  useTeamAssignmentsOverview,
} from "@/features/admin/hooks/use-admin-assignments";
import { trackApi } from "@/lib/api/track.api";
import { teamApi } from "@/lib/api/team.api";
import type { EventStatus, TrackResponse } from "@/lib/api";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 14,
  outline: "none",
  background: "#fff",
};

const headerCell: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#8891a5",
  letterSpacing: "0.24px",
  lineHeight: "12px",
  padding: "12px 16px",
  textAlign: "left",
};

const bodyCell: React.CSSProperties = {
  fontSize: 14,
  color: "#0e1528",
  lineHeight: "20px",
  padding: "14px 16px",
};

const STATUS_LABELS: Partial<Record<EventStatus, string>> = {
  UPCOMING: "Upcoming",
  OPEN: "Open",
  CLOSED_REGISTRATION: "Registration Closed",
  ACTIVE: "Active",
  SCORING: "Scoring",
  COMPLETED: "Closed",
  CANCELLED: "Cancelled",
};

function PersonChips({
  names,
  emptyLabel,
  maxVisible = 4,
}: {
  names: string[];
  emptyLabel: string;
  maxVisible?: number;
}) {
  if (names.length === 0) {
    return <span className="text-sm text-seal-text-muted">{emptyLabel}</span>;
  }
  const visible = names.slice(0, maxVisible);
  const rest = names.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((name, index) => (
        <span
          key={`${name}-${index}`}
          className="inline-flex border border-navy/20 bg-seal-surface-elevated px-2 py-0.5 text-xs font-medium text-navy"
        >
          {name}
        </span>
      ))}
      {rest > 0 && (
        <span className="inline-flex px-1.5 py-0.5 text-xs font-medium text-seal-text-muted">
          +{rest}
        </span>
      )}
    </div>
  );
}

function CompactNames({ names, emptyLabel }: { names: string[]; emptyLabel: string }) {
  if (names.length === 0) {
    return <span className="text-amber-700">{emptyLabel}</span>;
  }
  if (names.length <= 2) {
    return <span className="font-medium text-navy">{names.join(", ")}</span>;
  }
  return (
    <span className="font-medium text-navy" title={names.join(", ")}>
      {names.slice(0, 2).join(", ")}
      <span className="ml-1 text-seal-text-muted">+{names.length - 2}</span>
    </span>
  );
}

function TrackCard({
  track,
  teamCount,
  selected,
  onSelect,
}: {
  track: TrackResponse;
  teamCount: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full border-2 p-4 text-left transition-colors ${
        selected
          ? "border-navy bg-seal-yellow shadow-[3px_3px_0_0_#0c1228]"
          : "border-navy/20 bg-white hover:border-navy"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-bold text-navy">{track.name}</p>
          {track.topic && (
            <p className="mt-1 text-xs text-seal-text-secondary line-clamp-2">{track.topic}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            track.status === "LOCKED"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-sky-100 text-sky-800"
          }`}
        >
          {track.status}
        </span>
      </div>
      <p className="mt-3 font-mono text-xs text-seal-text-secondary">
        {teamCount} team{teamCount === 1 ? "" : "s"}
        {track.maxTeams != null ? ` · max ${track.maxTeams}` : ""}
      </p>
    </button>
  );
}

type TeamGapFilter = "all" | "no-mentor" | "no-judge";

const PAGE_SIZE = 10;

function TrackDetailPanel({
  eventId,
  track,
  roundId,
  roundType,
}: {
  eventId: string;
  track: TrackResponse;
  roundId: string;
  roundType?: string;
}) {
  const isFinal = roundType === "FINAL";
  const [teamQuery, setTeamQuery] = useState("");
  const [gapFilter, setGapFilter] = useState<TeamGapFilter>("all");
  const [page, setPage] = useState(0);
  const [showMentorPool, setShowMentorPool] = useState(false);
  const [showJudgePool, setShowJudgePool] = useState(false);

  const { data: mentors = [], isLoading: loadingMentors } = useMentorAssignments(
    eventId,
    track.id,
  );
  /** Final judges are ROUND-scoped; prelim judges are filtered by track. */
  const { data: judges = [], isLoading: loadingJudges } = useJudgeAssignments(
    eventId,
    roundId,
    isFinal
      ? undefined
      : { trackId: track.id, requiresTrackId: true },
  );
  const { data: overview, isLoading: loadingTeams } = useTeamAssignmentsOverview(
    eventId,
    { roundId, trackId: track.id },
  );

  const activeJudges = useMemo(
    () => judges.filter((j) => j.active),
    [judges],
  );
  const teams = overview?.teams ?? [];

  const uniqueJudgesFromTeams = useMemo(() => {
    const map = new Map<string, string>();
    for (const team of teams) {
      for (const j of team.judges) {
        if (!map.has(j.judgeUserId)) {
          map.set(j.judgeUserId, j.judgeFullName ?? j.judgeUserId);
        }
      }
    }
    return Array.from(map.values());
  }, [teams]);

  const filteredTeams = useMemo(() => {
    const q = teamQuery.trim().toLowerCase();
    return teams.filter((team) => {
      if (gapFilter === "no-mentor" && team.mentorUserId) return false;
      if (gapFilter === "no-judge" && team.judgeCount > 0) return false;
      if (!q) return true;
      const haystack = [
        team.teamName,
        team.groupName,
        team.mentorFullName,
        ...team.judges.map((j) => j.judgeFullName),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [teams, teamQuery, gapFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredTeams.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pagedTeams = filteredTeams.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  useEffect(() => {
    setPage(0);
  }, [teamQuery, gapFilter, track.id]);

  const loading = loadingMentors || loadingJudges || loadingTeams;
  const missingMentorCount = teams.filter((t) => !t.mentorUserId).length;
  const missingJudgeCount = teams.filter((t) => t.judgeCount === 0).length;

  return (
    <div className="flex flex-col gap-5 border-2 border-navy bg-white p-6 shadow-[4px_4px_0_0_#0c1228]">
      <div>
        <h3 className="font-mono text-lg font-bold text-navy">{track.name}</h3>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Mentors, judges, and teams for this track
          {track.description ? ` — ${track.description}` : ""}.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-seal-text-muted">Loading track details…</p>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="border border-navy/15 bg-seal-surface-elevated p-4">
              <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-seal-text-muted">
                Mentors
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-navy">{mentors.length}</p>
              <div className="mt-3">
                <PersonChips
                  names={mentors.map((m) => m.mentorFullName ?? m.mentorEmail ?? "Unknown")}
                  emptyLabel="No track mentors assigned"
                  maxVisible={3}
                />
              </div>
            </div>
            <div className="border border-navy/15 bg-seal-surface-elevated p-4">
              <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-seal-text-muted">
                Judges
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-navy">{activeJudges.length}</p>
              <div className="mt-3">
                <PersonChips
                  names={activeJudges.map(
                    (j) => j.judgeFullName ?? j.judgeEmail ?? "Unknown",
                  )}
                  emptyLabel="No judges assigned"
                  maxVisible={3}
                />
              </div>
              {uniqueJudgesFromTeams.length > 0 && activeJudges.length === 0 && (
                <p className="mt-2 text-xs text-seal-text-muted">
                  Effective judges by team: {uniqueJudgesFromTeams.slice(0, 3).join(", ")}
                  {uniqueJudgesFromTeams.length > 3
                    ? ` +${uniqueJudgesFromTeams.length - 3}`
                    : ""}
                </p>
              )}
            </div>
            <div className="border border-navy/15 bg-seal-surface-elevated p-4">
              <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-seal-text-muted">
                Teams
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-navy">{teams.length}</p>
              <p className="mt-3 text-xs text-seal-text-secondary">
                {teams.filter((t) => t.mentorUserId).length} with mentor ·{" "}
                {teams.filter((t) => t.judgeCount > 0).length} with judges
              </p>
            </div>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <h4 className="font-mono text-sm font-bold text-navy">Teams in track</h4>
              <p className="text-xs text-seal-text-muted">
                {filteredTeams.length}/{teams.length} shown · page {safePage + 1}/{pageCount}
              </p>
            </div>

            {teams.length === 0 ? (
              <p className="text-sm text-seal-text-muted">No teams in this track yet.</p>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap gap-2">
                  <input
                    type="search"
                    value={teamQuery}
                    onChange={(e) => setTeamQuery(e.target.value)}
                    placeholder="Search team, mentor, judge…"
                    style={{ ...inputStyle, minWidth: 220, flex: "1 1 220px" }}
                  />
                  <select
                    value={gapFilter}
                    onChange={(e) => setGapFilter(e.target.value as TeamGapFilter)}
                    style={inputStyle}
                  >
                    <option value="all">All teams</option>
                    <option value="no-mentor">
                      Missing mentor ({missingMentorCount})
                    </option>
                    <option value="no-judge">
                      Missing judge ({missingJudgeCount})
                    </option>
                  </select>
                </div>

                <div className="max-h-[420px] overflow-auto border border-navy/15">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-navy/10 bg-seal-surface-elevated">
                        <th style={headerCell}>Team</th>
                        <th style={headerCell}>Group</th>
                        <th style={headerCell}>Members</th>
                        <th style={headerCell}>Mentor</th>
                        <th style={headerCell}>Judges</th>
                        <th style={headerCell}>Submission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedTeams.map((team) => {
                        const judgeNames = team.judges.map(
                          (j) => j.judgeFullName ?? "Unknown",
                        );
                        return (
                          <tr
                            key={team.teamId}
                            className="border-t border-navy/10 align-middle"
                          >
                            <td
                              style={{
                                ...bodyCell,
                                fontWeight: 600,
                                padding: "10px 16px",
                              }}
                            >
                              {team.teamName}
                            </td>
                            <td
                              style={{
                                ...bodyCell,
                                color: "#8891a5",
                                padding: "10px 16px",
                              }}
                            >
                              {team.groupName ?? "—"}
                            </td>
                            <td style={{ ...bodyCell, padding: "10px 16px" }}>
                              {team.memberCount}
                            </td>
                            <td style={{ ...bodyCell, padding: "10px 16px" }}>
                              {team.mentorFullName ? (
                                <span className="font-medium text-navy">
                                  {team.mentorFullName}
                                </span>
                              ) : (
                                <span className="text-amber-700">Unassigned</span>
                              )}
                            </td>
                            <td style={{ ...bodyCell, padding: "10px 16px" }}>
                              <CompactNames
                                names={judgeNames}
                                emptyLabel="Unassigned"
                              />
                            </td>
                            <td
                              style={{
                                ...bodyCell,
                                color: "#8891a5",
                                padding: "10px 16px",
                              }}
                            >
                              {team.submissionStatus ?? "—"}
                            </td>
                          </tr>
                        );
                      })}
                      {pagedTeams.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center text-sm text-seal-text-muted"
                          >
                            No teams match this filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {pageCount > 1 && (
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(0, safePage - 1))}
                      disabled={safePage === 0}
                      className="border border-navy/30 bg-white px-3 py-1.5 text-xs font-mono font-bold text-navy disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPage((p) => Math.min(pageCount - 1, safePage + 1))
                      }
                      disabled={safePage >= pageCount - 1}
                      className="border border-navy/30 bg-white px-3 py-1.5 text-xs font-mono font-bold text-navy disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {(mentors.length > 0 || activeJudges.length > 0) && (
            <section className="flex flex-col gap-2 border-t border-navy/10 pt-4">
              <p className="font-mono text-xs font-bold uppercase tracking-wide text-seal-text-muted">
                Assignment details (optional)
              </p>
              {mentors.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowMentorPool((v) => !v)}
                    className="text-sm font-semibold text-navy underline-offset-2 hover:underline"
                  >
                    {showMentorPool ? "Hide" : "Show"} mentors ({mentors.length})
                  </button>
                  {showMentorPool && (
                    <div className="mt-2 max-h-48 overflow-auto border border-navy/15">
                      <table className="w-full border-collapse">
                        <thead className="sticky top-0">
                          <tr className="border-b border-navy/10 bg-seal-surface-elevated">
                            <th style={headerCell}>Name</th>
                            <th style={headerCell}>Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mentors.map((m) => (
                            <tr key={m.id} className="border-t border-navy/10">
                              <td style={{ ...bodyCell, fontWeight: 600, padding: "10px 16px" }}>
                                {m.mentorFullName ?? "Unknown"}
                              </td>
                              <td style={{ ...bodyCell, color: "#8891a5", padding: "10px 16px" }}>
                                {m.mentorEmail ?? "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {activeJudges.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowJudgePool((v) => !v)}
                    className="text-sm font-semibold text-navy underline-offset-2 hover:underline"
                  >
                    {showJudgePool ? "Hide" : "Show"} judges ({activeJudges.length})
                  </button>
                  {showJudgePool && (
                    <div className="mt-2 max-h-48 overflow-auto border border-navy/15">
                      <table className="w-full border-collapse">
                        <thead className="sticky top-0">
                          <tr className="border-b border-navy/10 bg-seal-surface-elevated">
                            <th style={headerCell}>Name</th>
                            <th style={headerCell}>Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeJudges.map((j) => (
                            <tr key={j.id} className="border-t border-navy/10">
                              <td style={{ ...bodyCell, fontWeight: 600, padding: "10px 16px" }}>
                                {j.judgeFullName ?? "Unknown"}
                              </td>
                              <td style={{ ...bodyCell, color: "#8891a5", padding: "10px 16px" }}>
                                {j.judgeEmail ?? "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

export function AssignmentOverviewPage() {
  const userEmail = useAuthStore((s) => s.user?.email);
  const [eventId, setEventId] = useState("");
  const [trackId, setTrackId] = useState("");
  const [roundId, setRoundId] = useState("");

  const { data: eventsPage, isLoading: loadingEvents } = useAdminEvents();
  const events = eventsPage?.content ?? [];

  const { data: tracks = [], isLoading: loadingTracks } = useQuery({
    queryKey: ["tracks", eventId, userEmail, "overview"],
    queryFn: () => trackApi.list(eventId),
    enabled: !!eventId,
  });

  const { data: rounds = [] } = useAdminRounds(eventId);

  const { data: teamsPage } = useQuery({
    queryKey: ["teams", eventId, "overview", userEmail],
    queryFn: () => teamApi.list(eventId, { page: 0, size: 200 }),
    enabled: !!eventId,
  });

  const confirmedTeams = useMemo(
    () => (teamsPage?.content ?? []).filter((t) => t.status === "CONFIRMED"),
    [teamsPage],
  );

  const teamCountByTrack = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of confirmedTeams) {
      if (!t.trackId) continue;
      map.set(t.trackId, (map.get(t.trackId) ?? 0) + 1);
    }
    return map;
  }, [confirmedTeams]);

  const selectedEvent = events.find((e) => e.id === eventId);
  const selectedTrack = tracks.find((t) => t.id === trackId);

  useEffect(() => {
    setTrackId("");
    setRoundId("");
  }, [eventId]);

  useEffect(() => {
    if (!rounds.length) {
      setRoundId("");
      return;
    }
    setRoundId((prev) => {
      if (prev && rounds.some((r) => r.id === prev)) return prev;
      const prelim = rounds.find((r) => r.roundType === "PRELIMINARY");
      return (prelim ?? rounds[0]).id;
    });
  }, [rounds]);

  return (
    <div>
      <StaffAssignmentNav />
      <AssignmentWorkflowBanner step="overview" />

      <div className="mb-6">
        <h1 className="font-mono text-2xl font-bold text-navy">Assignment Overview</h1>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Filter by event, then select a track to see mentors, judges, and teams
          (including who mentors / who judges when already assigned).
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <label className="flex min-w-[280px] flex-col gap-1.5">
          <span className="text-sm font-semibold text-navy">Event</span>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            style={inputStyle}
            disabled={loadingEvents}
          >
            <option value="">Select event…</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
                {ev.status ? ` (${STATUS_LABELS[ev.status] ?? ev.status})` : ""}
              </option>
            ))}
          </select>
        </label>

        {eventId && rounds.length > 0 && (
          <label className="flex min-w-[220px] flex-col gap-1.5">
            <span className="text-sm font-semibold text-navy">Round (for judges)</span>
            <select
              value={roundId}
              onChange={(e) => setRoundId(e.target.value)}
              style={inputStyle}
            >
              {rounds.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.roundType})
                </option>
              ))}
            </select>
          </label>
        )}

        {selectedEvent && (
          <p className="pb-2 text-xs text-seal-text-muted">
            {selectedEvent.season} {selectedEvent.year} · {tracks.length} track
            {tracks.length === 1 ? "" : "s"} · {confirmedTeams.length} confirmed team
            {confirmedTeams.length === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {!eventId ? (
        <div className="border-2 border-dashed border-navy/20 bg-white p-10 text-center text-sm text-seal-text-muted">
          Select an event to view its tracks.
        </div>
      ) : loadingTracks ? (
        <p className="text-sm text-seal-text-muted">Loading tracks…</p>
      ) : tracks.length === 0 ? (
        <div className="border-2 border-dashed border-navy/20 bg-white p-10 text-center text-sm text-seal-text-muted">
          This event has no tracks yet.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-3">
            <p className="font-mono text-xs font-bold uppercase tracking-wide text-seal-text-muted">
              Tracks
            </p>
            {tracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                teamCount={teamCountByTrack.get(track.id) ?? 0}
                selected={track.id === trackId}
                onSelect={() => setTrackId(track.id)}
              />
            ))}
            {confirmedTeams.some((t) => !t.trackId) && (
              <p className="text-xs text-amber-700">
                {confirmedTeams.filter((t) => !t.trackId).length} team(s) not assigned to a track.
              </p>
            )}
          </aside>

          <div>
            {!trackId ? (
              <div className="border-2 border-dashed border-navy/20 bg-white p-10 text-center text-sm text-seal-text-muted">
                Select a track on the left to view mentors, judges, and teams.
              </div>
            ) : !roundId ? (
              <div className="border-2 border-dashed border-navy/20 bg-white p-10 text-center text-sm text-seal-text-muted">
                This event has no rounds — judges cannot be shown per team.
              </div>
            ) : selectedTrack ? (
              <TrackDetailPanel
                key={`${selectedTrack.id}-${roundId}`}
                eventId={eventId}
                track={selectedTrack}
                roundId={roundId}
                roundType={rounds.find((r) => r.id === roundId)?.roundType}
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
