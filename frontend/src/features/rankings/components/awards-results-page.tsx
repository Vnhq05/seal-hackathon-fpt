"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { eventApi, type EventResponse } from "@/lib/api/event.api";
import {
  useMyParticipationCertificate,
  useParticipationSummary,
  usePublicAwards,
} from "@/features/coordinator/hooks/use-awards";
import { useMyTeamsAllEvents } from "@/features/teams/hooks/use-my-teams-all-events";
import { formatPrizeAmount, getPrizeLabel } from "@/lib/prize.utils";

const filterSelectClass =
  "border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm text-seal-text outline-none focus:border-royal/40";

function pickDefaultEventId(
  events: EventResponse[],
  enrolledEventIds: Set<string>,
): string {
  if (events.length === 0) return "";
  const visible = events.find((e) => e.studentResultsVisible === true);
  if (visible) return visible.id;
  const enrolled = events.find((e) => enrolledEventIds.has(e.id));
  if (enrolled) return enrolled.id;
  return events[0].id;
}

export function AwardsResultsPage() {
  const [season, setSeason] = useState("");
  const [year, setYear] = useState("");
  const [eventId, setEventId] = useState("");

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["award-events"],
    queryFn: () => eventApi.list({ size: 100 }).then((p) => p.content),
  });
  const { data: myEventTeams = [] } = useMyTeamsAllEvents();

  const enrolledEventIds = useMemo(() => {
    const ids = new Set<string>();
    for (const item of myEventTeams) {
      ids.add(item.event.id);
    }
    return ids;
  }, [myEventTeams]);

  const seasons = useMemo(
    () => [...new Set(events.map((e) => e.season).filter(Boolean))].sort(),
    [events],
  );

  const years = useMemo(
    () => [...new Set(events.map((e) => e.year))].sort((a, b) => b - a),
    [events],
  );

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (season && e.season !== season) return false;
      if (year && String(e.year) !== year) return false;
      return true;
    });
  }, [events, season, year]);

  useEffect(() => {
    if (filteredEvents.length === 0) {
      if (eventId) setEventId("");
      return;
    }
    const stillValid = filteredEvents.some((e) => e.id === eventId);
    if (!stillValid) {
      setEventId(pickDefaultEventId(filteredEvents, enrolledEventIds));
    }
  }, [filteredEvents, eventId, enrolledEventIds]);

  const selectedEvent = filteredEvents.find((e) => e.id === eventId) ?? null;
  const resultsVisible = selectedEvent?.studentResultsVisible === true;
  const hasActiveReviews = selectedEvent?.hasActiveScoreReviews === true;
  const isPublic = selectedEvent?.leaderboardPublic === true;
  const staffClosed = selectedEvent?.staffCompleted === true;

  const { data: awards, isLoading } = usePublicAwards(eventId || undefined, !!eventId && resultsVisible);
  const { data: participationSummary } = useParticipationSummary(
    eventId || undefined,
    !!eventId && resultsVisible,
  );
  const { data: myCertificate } = useMyParticipationCertificate(
    eventId || undefined,
    !!eventId && resultsVisible,
  );

  const myTeamId = myEventTeams.find((t) => t.event.id === eventId)?.team?.id;

  const sortedAwards = useMemo(() => {
    if (!awards) return [];
    if (!myTeamId) return awards;
    return [...awards].sort((a, b) => {
      if (a.teamId === myTeamId && b.teamId !== myTeamId) return -1;
      if (b.teamId === myTeamId && a.teamId !== myTeamId) return 1;
      return 0;
    });
  }, [awards, myTeamId]);

  const pendingMessage = (() => {
    if (!selectedEvent) return null;
    if (resultsVisible) return null;
    if (hasActiveReviews) {
      return "Results will appear after the judging panel reaches consensus on scores.";
    }
    if (!staffClosed) {
      return "Results are available after the competition is closed by an admin or coordinator.";
    }
    if (!isPublic) {
      return "Results are ready for release once an admin or coordinator makes them public.";
    }
    return "Results are not available yet.";
  })();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Results & Awards</h1>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Published prizes and participation certificates by hackathon event.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          className={filterSelectClass}
          style={{ minWidth: 160 }}
        >
          <option value="">All seasons</option>
          {seasons.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className={filterSelectClass}
          style={{ minWidth: 120 }}
        >
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className={filterSelectClass}
          style={{ minWidth: 220 }}
          disabled={eventsLoading || filteredEvents.length === 0}
        >
          {filteredEvents.length === 0 ? (
            <option value="">No events</option>
          ) : (
            filteredEvents.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
                {e.studentResultsVisible ? "" : " (pending)"}
              </option>
            ))
          )}
        </select>
      </div>

      {selectedEvent && (
        <p className="text-sm text-seal-text-secondary">
          {selectedEvent.season} {selectedEvent.year} &middot; {selectedEvent.name}
        </p>
      )}

      {!eventsLoading && filteredEvents.length === 0 && (
        <p className="rounded-lg border border-navy/20 bg-white p-6 text-sm text-seal-text-secondary">
          No events match the selected filters.
        </p>
      )}

      {pendingMessage && (
        <p className="rounded-lg border border-navy/20 bg-white p-6 text-sm text-seal-text-secondary">
          {pendingMessage}
        </p>
      )}

      {resultsVisible && isLoading && <p className="text-sm text-seal-text-muted">Loading...</p>}

      {resultsVisible && !isLoading && (!awards || awards.length === 0) && (
        <p className="rounded-lg border border-navy/20 bg-white p-6 text-sm text-seal-text-secondary">
          Awards have not been announced yet.
        </p>
      )}

      {resultsVisible && sortedAwards.length > 0 && (
        <ul className="space-y-3">
          {sortedAwards.map((a) => {
            const prizeValue = formatPrizeAmount(a.prizeValue);
            return (
              <li
                key={a.id}
                className="flex items-center justify-between border-2 border-navy bg-white px-4 py-3 shadow-[3px_3px_0_0_#0c1228]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-xs font-bold uppercase text-royal">
                      {getPrizeLabel(a.prizeRank, a.prizeLabel)}
                    </p>
                    {a.teamId === myTeamId && (
                      <span className="rounded bg-royal px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Your Team
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-navy">{a.teamName ?? "Unknown team"}</p>
                  {prizeValue && (
                    <p className="mt-0.5 font-mono text-sm text-navy">{prizeValue}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {resultsVisible && participationSummary && participationSummary.issuedCount > 0 && (
        <p className="rounded-lg border border-navy/20 bg-white p-4 text-sm text-seal-text-secondary">
          Issued {participationSummary.issuedCount.toLocaleString("vi-VN")} participation certificates
          to confirmed team members.
        </p>
      )}

      {resultsVisible && myCertificate && (
        <div className="rounded-lg border-2 border-royal bg-white p-5 shadow-[3px_3px_0_0_#0c1228]">
          <p className="font-mono text-xs font-bold uppercase text-royal">
            Your participation certificate
          </p>
          <p className="mt-2 text-lg font-semibold text-navy">{myCertificate.userFullName}</p>
          <p className="mt-1 text-sm text-seal-text-secondary">Team: {myCertificate.teamName}</p>
          <p className="mt-3 text-xs text-seal-text-muted">
            Issued on{" "}
            {new Date(myCertificate.issuedAt).toLocaleDateString("vi-VN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      )}
    </div>
  );
}
