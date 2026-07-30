"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { StaffAssignmentNav } from "@/shared/components/staff-assignment-nav";
import { useAdminEvents } from "@/features/admin/hooks/use-admin-hackathons";
import { useAdminRounds } from "@/features/admin/hooks/use-admin-rounds";
import {
  useJudgeAssignments,
  useMentorAssignments,
  useTeamAssignmentsOverview,
} from "@/features/admin/hooks/use-admin-assignments";
import { trackApi } from "@/lib/api/track.api";
import { teamApi } from "@/lib/api/team.api";
import type { EventStatus, RoundType, TrackResponse } from "@/lib/api";

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
}: {
  names: string[];
  emptyLabel: string;
}) {
  if (names.length === 0) {
    return <span className="text-sm text-seal-text-muted">{emptyLabel}</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {names.map((name, index) => (
        <span
          key={`${name}-${index}`}
          className="inline-flex border border-navy/20 bg-seal-surface-elevated px-2 py-0.5 text-xs font-medium text-navy"
        >
          {name}
        </span>
      ))}
    </div>
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

function TrackDetailPanel({
  eventId,
  track,
  roundId,
  roundType,
}: {
  eventId: string;
  track: TrackResponse;
  roundId: string;
  roundType?: RoundType | null;
}) {
  const isFinal = roundType === "FINAL";
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

  const loading = loadingMentors || loadingJudges || loadingTeams;

  return (
    <div className="flex flex-col gap-5 border-2 border-navy bg-white p-6 shadow-[4px_4px_0_0_#0c1228]">
      <div>
        <h3 className="font-mono text-lg font-bold text-navy">{track.name}</h3>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Tổng hợp mentor, judge và team trong track này
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
                  emptyLabel="Chưa gán mentor track"
                />
              </div>
            </div>
            <div className="border border-navy/15 bg-seal-surface-elevated p-4">
              <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-seal-text-muted">
                Judges (pool)
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-navy">{activeJudges.length}</p>
              <div className="mt-3">
                <PersonChips
                  names={activeJudges.map(
                    (j) => j.judgeFullName ?? j.judgeEmail ?? "Unknown",
                  )}
                  emptyLabel="Chưa gán judge cho track/round"
                />
              </div>
              {uniqueJudgesFromTeams.length > 0 && activeJudges.length === 0 && (
                <p className="mt-2 text-xs text-seal-text-muted">
                  Judges hiệu lực theo team: {uniqueJudgesFromTeams.join(", ")}
                </p>
              )}
            </div>
            <div className="border border-navy/15 bg-seal-surface-elevated p-4">
              <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-seal-text-muted">
                Teams
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-navy">{teams.length}</p>
              <p className="mt-3 text-xs text-seal-text-secondary">
                {teams.filter((t) => t.mentorUserId).length} có mentor ·{" "}
                {teams.filter((t) => t.judgeCount > 0).length} có judge
              </p>
            </div>
          </section>

          <section>
            <h4 className="mb-3 font-mono text-sm font-bold text-navy">Teams trong track</h4>
            {teams.length === 0 ? (
              <p className="text-sm text-seal-text-muted">Chưa có team nào trong track này.</p>
            ) : (
              <div className="overflow-x-auto border border-navy/15">
                <table className="w-full border-collapse">
                  <thead>
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
                    {teams.map((team) => {
                      const judgeNames = team.judges.map(
                        (j) => j.judgeFullName ?? "Unknown",
                      );
                      return (
                        <tr
                          key={team.teamId}
                          className="border-t border-navy/10 align-top"
                        >
                          <td style={{ ...bodyCell, fontWeight: 600 }}>{team.teamName}</td>
                          <td style={{ ...bodyCell, color: "#8891a5" }}>
                            {team.groupName ?? "—"}
                          </td>
                          <td style={bodyCell}>{team.memberCount}</td>
                          <td style={bodyCell}>
                            {team.mentorFullName ? (
                              <span className="font-medium text-navy">
                                {team.mentorFullName}
                              </span>
                            ) : (
                              <span className="text-amber-700">Chưa assign</span>
                            )}
                          </td>
                          <td style={bodyCell}>
                            {judgeNames.length > 0 ? (
                              <PersonChips names={judgeNames} emptyLabel="" />
                            ) : (
                              <span className="text-amber-700">Chưa assign</span>
                            )}
                          </td>
                          <td style={{ ...bodyCell, color: "#8891a5" }}>
                            {team.submissionStatus ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {mentors.length > 0 && (
            <section>
              <h4 className="mb-3 font-mono text-sm font-bold text-navy">
                Mentor pool (track)
              </h4>
              <div className="overflow-x-auto border border-navy/15">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-navy/10 bg-seal-surface-elevated">
                      <th style={headerCell}>Name</th>
                      <th style={headerCell}>Email</th>
                      <th style={headerCell}>Assigned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mentors.map((m) => (
                      <tr key={m.id} className="border-t border-navy/10">
                        <td style={{ ...bodyCell, fontWeight: 600 }}>
                          {m.mentorFullName ?? "Unknown"}
                        </td>
                        <td style={{ ...bodyCell, color: "#8891a5" }}>
                          {m.mentorEmail ?? "—"}
                        </td>
                        <td style={{ ...bodyCell, color: "#8891a5" }}>
                          {new Date(m.assignedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeJudges.length > 0 && (
            <section>
              <h4 className="mb-3 font-mono text-sm font-bold text-navy">
                Judge pool (round · track)
              </h4>
              <div className="overflow-x-auto border border-navy/15">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-navy/10 bg-seal-surface-elevated">
                      <th style={headerCell}>Name</th>
                      <th style={headerCell}>Email</th>
                      <th style={headerCell}>Scope</th>
                      <th style={headerCell}>Group</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeJudges.map((j) => (
                      <tr key={j.id} className="border-t border-navy/10">
                        <td style={{ ...bodyCell, fontWeight: 600 }}>
                          {j.judgeFullName ?? "Unknown"}
                        </td>
                        <td style={{ ...bodyCell, color: "#8891a5" }}>
                          {j.judgeEmail ?? "—"}
                        </td>
                        <td style={{ ...bodyCell, color: "#8891a5" }}>{j.scope}</td>
                        <td style={{ ...bodyCell, color: "#8891a5" }}>
                          {j.groupName ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

      <div className="mb-6">
        <h1 className="font-mono text-2xl font-bold text-navy">Assignment Overview</h1>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Lọc theo event, chọn track để xem mentor, judge và team (kèm ai mentor / ai chấm nếu đã assign).
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
            <span className="text-sm font-semibold text-navy">Round (cho judge)</span>
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
          Chọn event để xem danh sách track.
        </div>
      ) : loadingTracks ? (
        <p className="text-sm text-seal-text-muted">Loading tracks…</p>
      ) : tracks.length === 0 ? (
        <div className="border-2 border-dashed border-navy/20 bg-white p-10 text-center text-sm text-seal-text-muted">
          Event này chưa có track.
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
                {confirmedTeams.filter((t) => !t.trackId).length} team chưa gán track.
              </p>
            )}
          </aside>

          <div>
            {!trackId ? (
              <div className="border-2 border-dashed border-navy/20 bg-white p-10 text-center text-sm text-seal-text-muted">
                Bấm vào một track bên trái để xem tổng hợp mentor / judge / team.
              </div>
            ) : !roundId ? (
              <div className="border-2 border-dashed border-navy/20 bg-white p-10 text-center text-sm text-seal-text-muted">
                Event chưa có round — không thể hiển thị judge theo team.
              </div>
            ) : selectedTrack ? (
              <TrackDetailPanel
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
