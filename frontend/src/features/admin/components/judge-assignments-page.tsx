"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignmentApi,
  eventApi,
  roundApi,
  trackApi,
  type EventResponse,
  type TeamAssignmentOverview,
  type EventJudgeOption,
} from "@/lib/api";

const SEASONS = ["Spring", "Summer", "Fall", "Winter"] as const;

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month < 3) return "Spring";
  if (month < 6) return "Summer";
  if (month < 9) return "Fall";
  return "Winter";
}

function AssignJudgesModal({
  eventId,
  roundId,
  team,
  eligibleJudges,
  onClose,
}: {
  eventId: string;
  roundId: string;
  team: TeamAssignmentOverview;
  eligibleJudges: EventJudgeOption[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const initial = team.judges.map((j) => j.judgeUserId);
  const [j1, setJ1] = useState(initial[0] ?? "");
  const [j2, setJ2] = useState(initial[1] ?? "");
  const [j3, setJ3] = useState(initial[2] ?? "");
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      assignmentApi.assignTeamJudges({
        eventId,
        roundId,
        teamId: team.teamId,
        judgeUserIds: [j1, j2, j3],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-assignments-overview"] });
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  const selected = new Set([j1, j2, j3].filter(Boolean));

  const renderSelect = (value: string, onChange: (v: string) => void, label: string) => (
    <div>
      <label className="mb-1 block text-xs font-medium text-seal-text-secondary">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-seal-border bg-seal-surface px-3 py-2 text-sm outline-none focus:border-seal-cyan/40"
      >
        <option value="">Chọn judge...</option>
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
          Cảnh báo: Judge này đang là mentor của team {team.teamName}
        </p>
      )}
    </div>
  );

  const handleSubmit = () => {
    setError(null);
    if (!j1 || !j2 || !j3) {
      setError("Vui lòng chọn đủ 3 judge");
      return;
    }
    if (new Set([j1, j2, j3]).size !== 3) {
      setError("3 judge phải khác nhau");
      return;
    }
    if ([j1, j2, j3].some((id) => id === team.mentorUserId)) {
      setError("Không thể phân công mentor của team làm judge");
      return;
    }
    mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-xl border border-seal-border bg-seal-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-seal-text">Phân công judge</h2>
        <p className="mt-1 text-sm text-seal-text-muted">
          {team.teamName} — chọn đúng 3 judge
        </p>
        {team.mentorFullName && (
          <p className="mt-2 text-xs text-seal-text-secondary">
            Mentor: {team.mentorFullName}
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
            className="rounded-lg border border-seal-border px-4 py-2 text-sm font-medium text-seal-text"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-lg bg-seal-cyan px-4 py-2 text-sm font-semibold text-white hover:bg-seal-cyan-dark disabled:opacity-50"
          >
            {isPending ? "Đang lưu..." : "Lưu phân công"}
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

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["team-assignments-overview", selectedEventId, selectedRoundId, selectedTrackId, season, year],
    queryFn: () =>
      assignmentApi.getTeamAssignments(selectedEventId, {
        roundId: selectedRoundId,
        season,
        year,
        trackId: selectedTrackId || undefined,
      }),
    enabled: !!selectedEventId && !!selectedRoundId,
  });

  const selectedEvent = events.find((e: EventResponse) => e.id === selectedEventId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-seal-text">Phân công Judge</h1>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Mỗi team cần đúng 3 judge cho mỗi round. Judge không được là mentor của team.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={season}
          onChange={(e) => { setSeason(e.target.value); setSelectedEventId(""); }}
          className="rounded-lg border border-seal-border bg-seal-surface px-3 py-2 text-sm"
        >
          {SEASONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => { setYear(Number(e.target.value)); setSelectedEventId(""); }}
          className="rounded-lg border border-seal-border bg-seal-surface px-3 py-2 text-sm"
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
          className="min-w-[220px] rounded-lg border border-seal-border bg-seal-surface px-3 py-2 text-sm"
        >
          <option value="">Chọn event...</option>
          {events.map((e: EventResponse) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        {selectedEvent && tracks.length > 0 && (
          <select
            value={selectedTrackId}
            onChange={(e) => setSelectedTrackId(e.target.value)}
            className="rounded-lg border border-seal-border bg-seal-surface px-3 py-2 text-sm"
          >
            <option value="">Tất cả track</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
        {selectedEventId && (
          <select
            value={selectedRoundId}
            onChange={(e) => setSelectedRoundId(e.target.value)}
            className="rounded-lg border border-seal-border bg-seal-surface px-3 py-2 text-sm"
          >
            <option value="">Chọn round...</option>
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
        <p className="text-sm text-seal-text-muted">Không có event nào cho {season} {year}.</p>
      )}

      {selectedEventId && selectedRoundId && (
        <div className="overflow-hidden rounded-lg border border-seal-border bg-seal-surface">
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
                  <th className="px-4 py-3">Nộp bài</th>
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
                        {team.submissionStatus ?? "Chưa nộp"}
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
                        className="rounded-lg bg-seal-cyan px-3 py-1.5 text-xs font-semibold text-white hover:bg-seal-cyan-dark"
                      >
                        Phân công
                      </button>
                    </td>
                  </tr>
                ))}
                {(overview?.teams ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-seal-text-muted">
                      Không có team nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedEventId && !selectedRoundId && (
        <p className="text-sm text-seal-text-muted">Chọn round để xem danh sách team.</p>
      )}

      {modalTeam && overview && (
        <AssignJudgesModal
          eventId={selectedEventId}
          roundId={selectedRoundId}
          team={modalTeam}
          eligibleJudges={overview.eligibleJudges}
          onClose={() => setModalTeam(null)}
        />
      )}
    </div>
  );
}
