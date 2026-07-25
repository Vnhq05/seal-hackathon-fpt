"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { eventApi, roundApi, submissionApi, trackApi } from "@/lib/api";
import type { SubmissionResponse } from "@/lib/api";

const selectClass =
  "border-2 border-navy bg-white px-3 py-2 text-sm text-navy shadow-[3px_3px_0_0_#0c1228] outline-none focus:border-royal/40";

function formatSubmittedAt(iso: string | undefined | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: SubmissionResponse["status"] }) {
  const isSubmitted = status === "SUBMITTED";
  return (
    <span
      className="rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide"
      style={{
        backgroundColor: isSubmitted ? "#ecfdf5" : "#eef0f6",
        color: isSubmitted ? "#047857" : "#8891a5",
      }}
    >
      {status}
    </span>
  );
}

export function CoordinatorSubmissionsPage() {
  const searchParams = useSearchParams();

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["coordinator-events"],
    queryFn: () => eventApi.list({ page: 0, size: 50 }).then((p) => p.content),
  });

  const [eventId, setEventId] = useState(searchParams.get("eventId") ?? "");
  const [roundId, setRoundId] = useState(searchParams.get("roundId") ?? "");
  const [trackId, setTrackId] = useState(searchParams.get("trackId") ?? "");

  const selectedEventId = eventId || events[0]?.id || "";

  useEffect(() => {
    if (!eventId && events[0]?.id) {
      setEventId(events[0].id);
    }
  }, [events, eventId]);

  const { data: rounds = [], isLoading: roundsLoading } = useQuery({
    queryKey: ["coordinator-rounds", selectedEventId],
    queryFn: () => roundApi.list(selectedEventId),
    enabled: !!selectedEventId,
  });

  const { data: tracks = [], isLoading: tracksLoading } = useQuery({
    queryKey: ["coordinator-tracks", selectedEventId],
    queryFn: () => trackApi.list(selectedEventId),
    enabled: !!selectedEventId,
  });

  useEffect(() => {
    if (!roundId && rounds[0]?.id) {
      setRoundId(rounds[0].id);
    }
  }, [rounds, roundId]);

  const selectedRoundId = roundId || rounds[0]?.id || "";

  const {
    data: submissions = [],
    isLoading: submissionsLoading,
    isError: submissionsError,
    error: submissionsErrorObj,
  } = useQuery({
    queryKey: ["coordinator-submissions", selectedRoundId, trackId || "all"],
    queryFn: () => submissionApi.list(selectedRoundId, trackId || null),
    enabled: !!selectedRoundId,
  });

  const sorted = useMemo(
    () =>
      [...submissions].sort((a, b) =>
        (a.teamName ?? a.teamId).localeCompare(b.teamName ?? b.teamId, undefined, {
          sensitivity: "base",
        }),
      ),
    [submissions],
  );

  const loading = eventsLoading || roundsLoading || tracksLoading || submissionsLoading;

  const detailQuery = new URLSearchParams();
  if (selectedEventId) detailQuery.set("eventId", selectedEventId);
  if (selectedRoundId) detailQuery.set("roundId", selectedRoundId);
  if (trackId) detailQuery.set("trackId", trackId);

  const handleEventChange = (id: string) => {
    setEventId(id);
    setRoundId("");
    setTrackId("");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Submissions</h1>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Review team submission history and versions by event, round, and track.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-seal-text-secondary">
          Event
          <select
            className={selectClass}
            value={selectedEventId}
            onChange={(e) => handleEventChange(e.target.value)}
            disabled={eventsLoading || events.length === 0}
          >
            {events.length === 0 && <option value="">No events</option>}
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-seal-text-secondary">
          Round
          <select
            className={selectClass}
            value={selectedRoundId}
            onChange={(e) => setRoundId(e.target.value)}
            disabled={!selectedEventId || roundsLoading || rounds.length === 0}
          >
            {rounds.length === 0 && <option value="">No rounds</option>}
            {rounds.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-seal-text-secondary">
          Track
          <select
            className={selectClass}
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            disabled={!selectedEventId || tracksLoading}
          >
            <option value="">All tracks</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-navy bg-seal-surface-elevated text-[11px] font-bold uppercase tracking-wide text-seal-text-secondary">
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Track</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3">Latest submit</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-seal-text-muted">
                  Loading submissions…
                </td>
              </tr>
            )}
            {!loading && submissionsError && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-red-600">
                  Failed to load submissions
                  {submissionsErrorObj instanceof Error ? `: ${submissionsErrorObj.message}` : "."}
                </td>
              </tr>
            )}
            {!loading && !submissionsError && sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-seal-text-muted">
                  No submissions for this filter.
                </td>
              </tr>
            )}
            {!loading &&
              !submissionsError &&
              sorted.map((s) => (
                <tr key={s.id} className="border-b border-navy/10 last:border-b-0">
                  <td className="px-4 py-3 text-sm font-semibold text-navy">
                    {s.teamName ?? s.teamId}
                  </td>
                  <td className="px-4 py-3 text-sm text-navy">{s.trackName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-navy">
                    v{s.currentVersion}
                    <span className="ml-1 text-seal-text-muted">/ {s.totalVersions}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-seal-text-secondary">
                    {formatSubmittedAt(s.latestVersion?.submittedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/coordinator/submissions/${s.id}?${detailQuery.toString()}`}
                      className="inline-block border-2 border-navy bg-seal-yellow px-3 py-1.5 font-mono text-[11px] font-bold text-navy"
                    >
                      View history
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
