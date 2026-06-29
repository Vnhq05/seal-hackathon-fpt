"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eventApi } from "@/lib/api/event.api";
import { trackApi, type TrackResponse } from "@/lib/api/track.api";
import { teamApi } from "@/lib/api/team.api";
import { trackAssignmentApi } from "@/lib/api/track-assignment.api";
import { formatContestedSlotType, formatSelectionMethod } from "@/lib/api/finalist.utils";
import { EventPhasePanel } from "@/features/events/components/event-phase-panel";
import { useAssignAwards } from "@/features/coordinator/hooks/use-awards";
import { useTrackDrawSession } from "@/features/coordinator/hooks/use-track-draw-session";
import {
  useContestedFinalistSlots,
  useFinalists,
  useSelectFinalists,
} from "@/features/coordinator/hooks/use-finalists";
import { SealCard } from "@/shared/ui/seal-card";
import { SealButton } from "@/shared/ui/seal-button";

function formatDt(iso: string | null | undefined): string {
  if (!iso) return "—";
  return iso.slice(0, 16).replace("T", " ");
}

function SealDrawSessionPanel({
  eventId,
  teams,
  tracks,
}: {
  eventId: string;
  teams: { id: string; name: string; trackId: string | null }[];
  tracks: TrackResponse[];
}) {
  const [topicDrafts, setTopicDrafts] = useState<Record<string, string>>({});
  const {
    session,
    isLoadingSession,
    openSession,
    isOpening,
    openError,
    lockTracks,
    isLocking,
    lockResult,
    assignTopic,
    isAssigningTopic,
  } = useTrackDrawSession(eventId, true);

  const unassignedCount = teams.filter((t) => !t.trackId).length;
  const allAssigned = unassignedCount === 0 && teams.length > 0;
  const allHaveTopic = tracks.every((t) => t.topic);
  const allLocked = tracks.every((t) => t.status === "LOCKED");

  const handleOpenSession = () => {
    const unassigned = teams.filter((t) => !t.trackId);
    openSession({
      drawOrder: unassigned.length > 0 ? unassigned.map((t) => t.id) : undefined,
    });
  };

  return (
    <SealCard className="space-y-4 p-4">
      <h2 className="font-mono font-bold text-navy">Track draw session (SEAL)</h2>
      <p className="text-sm text-seal-text-secondary">
        {unassignedCount} teams without a track · {tracks.length} tracks · Teams pick in turn
      </p>

      {isLoadingSession && !session && (
        <p className="text-sm text-seal-text-muted">Loading draw session...</p>
      )}

      {!session && !isLoadingSession && (
        <SealButton onClick={handleOpenSession} disabled={isOpening || unassignedCount === 0}>
          {isOpening ? "Opening session..." : "Open draw session"}
        </SealButton>
      )}

      {openError && (
        <p className="text-sm text-red-600">{(openError as Error).message}</p>
      )}

      {session && (
        <div className="space-y-3 rounded border border-navy/20 bg-navy/5 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${
                session.status === "OPEN"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {session.status === "OPEN" ? "In progress" : "Closed"}
            </span>
            <span className="text-sm text-seal-text-secondary">
              Turn {session.currentIndex + 1}/{session.totalTeams}
            </span>
          </div>

          {session.status === "OPEN" && session.currentTeamName && (
            <p className="text-sm font-semibold text-navy">
              Current turn: {session.currentTeamName}
            </p>
          )}

          {session.openedAt && (
            <p className="text-xs text-seal-text-muted">Opened at: {formatDt(session.openedAt)}</p>
          )}

          {session.availableTracks.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-seal-text-muted">
                Tracks with open slots
              </p>
              <ul className="grid gap-2 sm:grid-cols-3">
                {session.availableTracks.map((slot) => (
                  <li
                    key={slot.trackId}
                    className="border border-navy/20 bg-white px-3 py-2 text-sm"
                  >
                    <span className="font-semibold">{slot.name}</span>
                    <span className="ml-2 text-seal-text-muted">({slot.remainingSlots} slots)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tracks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-navy">Assign topic to each track</h3>
          {tracks.map((track) => (
            <div key={track.id} className="flex flex-wrap items-end gap-2 border border-navy/10 p-3">
              <div className="min-w-[120px] flex-1">
                <p className="text-xs uppercase text-seal-text-muted">{track.name}</p>
                <p className="text-xs text-seal-text-secondary">
                  {track.assignedTeamCount ?? 0} teams
                  {track.status === "LOCKED" && " · Locked"}
                </p>
                {track.topic && (
                  <p className="mt-1 text-sm text-navy">
                    <span className="font-semibold">Topic:</span> {track.topic}
                  </p>
                )}
              </div>
              {!track.topic && track.status !== "LOCKED" && (
                <>
                  <input
                    type="text"
                    placeholder="Enter track topic..."
                    className="min-w-[200px] flex-1 border-2 border-navy px-2 py-1.5 text-sm"
                    value={topicDrafts[track.id] ?? ""}
                    onChange={(e) =>
                      setTopicDrafts((prev) => ({ ...prev, [track.id]: e.target.value }))
                    }
                  />
                  <SealButton
                    onClick={() => {
                      const topic = topicDrafts[track.id]?.trim();
                      if (topic) assignTopic({ trackId: track.id, topic });
                    }}
                    disabled={isAssigningTopic || !topicDrafts[track.id]?.trim()}
                  >
                    Assign topic
                  </SealButton>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {allAssigned && allHaveTopic && !allLocked && (
        <SealButton onClick={() => lockTracks()} disabled={isLocking}>
          {isLocking ? "Locking..." : "Lock all tracks (end of Day 1)"}
        </SealButton>
      )}

      {lockResult && (
        <p className="text-sm text-emerald-700">
          Locked {lockResult.lockedTrackCount} tracks.
        </p>
      )}

      {allLocked && (
        <p className="text-sm font-semibold text-emerald-700">
          All tracks are locked. Track assignments cannot be changed.
        </p>
      )}
    </SealCard>
  );
}

function GenericDrawPanel({
  eventId,
  unassignedCount,
}: {
  eventId: string;
  unassignedCount: number;
}) {
  const qc = useQueryClient();
  const drawMutation = useMutation({
    mutationFn: () => trackAssignmentApi.draw(eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams", eventId] });
    },
  });

  return (
    <SealCard className="space-y-4 p-4">
      <h2 className="font-mono font-bold text-navy">Track draw</h2>
      <p className="text-sm text-seal-text-secondary">{unassignedCount} teams without a track</p>
      <SealButton onClick={() => drawMutation.mutate()} disabled={drawMutation.isPending}>
        {drawMutation.isPending ? "Drawing..." : "Random draw"}
      </SealButton>
      {drawMutation.data && (
        <p className="text-sm text-emerald-700">
          Assigned {drawMutation.data.assignments.length} teams ·{" "}
          {drawMutation.data.unassignedCount} still unassigned
        </p>
      )}
    </SealCard>
  );
}

export function CoordinatorTrackAssignmentPage() {
  const [eventId, setEventId] = useState<string>("");

  const { data: events } = useQuery({
    queryKey: ["coordinator-events"],
    queryFn: () => eventApi.list({ size: 20 }).then((p) => p.content),
  });

  const selectedEvent = events?.find((e) => e.id === eventId);
  const isSeal = selectedEvent?.competitionFormat === "SEAL_RAG_2026";

  const { data: tracks } = useQuery({
    queryKey: ["tracks", eventId],
    queryFn: () => trackApi.list(eventId),
    enabled: !!eventId,
    refetchInterval: isSeal ? 4000 : false,
  });

  const { data: teams } = useQuery({
    queryKey: ["teams", eventId],
    queryFn: () => teamApi.list(eventId, { size: 100 }).then((p) => p.content),
    enabled: !!eventId,
    refetchInterval: isSeal ? 4000 : false,
  });

  const finalistMutation = useSelectFinalists(eventId || undefined);
  const { data: finalists = [] } = useFinalists(eventId || undefined, !!eventId);
  const { data: contestedSlots = [] } = useContestedFinalistSlots(eventId || undefined, !!eventId);

  const awardMutation = useAssignAwards(eventId || undefined);

  const sealEvents = events?.filter((e) => e.competitionFormat === "SEAL_RAG_2026") ?? [];
  const unassignedCount = teams?.filter((t) => !t.trackId).length ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Track & Finals Management</h1>
        <p className="text-sm text-seal-text-secondary">
          Run track draw, select Top 6, and assign awards for SEAL Hackathon.
        </p>
      </div>

      <SealCard className="p-4">
        <label className="text-xs font-semibold uppercase text-seal-text-muted">Select event</label>
        <select
          className="mt-2 w-full border-2 border-navy px-3 py-2 font-mono text-sm"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
        >
          <option value="">— Select event —</option>
          {(sealEvents.length > 0 ? sealEvents : events ?? []).map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} {e.competitionFormat === "SEAL_RAG_2026" ? "(SEAL)" : ""}
            </option>
          ))}
        </select>
      </SealCard>

      {eventId && selectedEvent && (
        <EventPhasePanel eventId={eventId} currentStatus={selectedEvent.status} />
      )}

      {eventId && (
        <>
          {isSeal && teams && tracks ? (
            <SealDrawSessionPanel eventId={eventId} teams={teams} tracks={tracks} />
          ) : (
            <GenericDrawPanel eventId={eventId} unassignedCount={unassignedCount} />
          )}

          <SealCard className="space-y-4 p-4">
            <h2 className="font-mono font-bold text-navy">Select Top 6 (Finals)</h2>
            <SealButton onClick={() => finalistMutation.mutate()} disabled={finalistMutation.isPending}>
              {finalistMutation.isPending ? "Selecting..." : "Select finalists (Top 2/track)"}
            </SealButton>
            {finalistMutation.data?.summary && (
              <p className="text-sm text-seal-text-secondary">
                Selected {finalistMutation.data.summary.selectedCount}/{finalistMutation.data.summary.targetCount} teams
                {finalistMutation.data.summary.penaltyEvaluationRequired && (
                  <span className="ml-2 font-semibold text-amber-700">— OC penalty review required</span>
                )}
              </p>
            )}
            {(finalists.length > 0 || finalistMutation.data?.finalists) && (
              <ul className="space-y-1 text-sm">
                {(finalistMutation.data?.finalists ?? finalists).map((f) => (
                  <li key={f.id}>
                    #{f.preliminaryRank} {f.teamName} — {f.trackName ?? "—"}
                    {f.selectionMethod && (
                      <span className="ml-1 text-seal-text-muted">
                        ({formatSelectionMethod(f.selectionMethod)})
                      </span>
                    )}
                    {f.needsPenaltyEvaluation && (
                      <span className="ml-1 text-amber-700">(penalty pending)</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {contestedSlots.length > 0 && (
              <div className="rounded border border-amber-400 bg-amber-50 p-3 text-sm">
                <p className="font-semibold text-amber-900">Contested positions — OC penalty review required</p>
                <ul className="mt-2 space-y-2">
                  {contestedSlots.map((slot) => (
                    <li key={slot.id}>
                      {slot.trackName ?? "Overflow"} ({formatContestedSlotType(slot.slotType)}):{" "}
                      {slot.teams.map((t) => t.teamName).join(" vs ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </SealCard>

          <SealCard className="space-y-4 p-4">
            <h2 className="font-mono font-bold text-navy">Award assignment</h2>
            <SealButton onClick={() => awardMutation.mutate()} disabled={awardMutation.isPending}>
              {awardMutation.isPending ? "Assigning..." : "Assign awards from finals leaderboard"}
            </SealButton>
            {awardMutation.isError && (
              <p className="text-sm text-red-600">
                {awardMutation.error instanceof Error
                  ? awardMutation.error.message
                  : "Unable to assign awards. Please try again."}
              </p>
            )}
            {awardMutation.data && (
              <div className="space-y-2 text-sm">
                <ul className="space-y-1">
                  {awardMutation.data.teamAwards.map((a) => (
                    <li key={a.id}>
                      {a.prizeLabel}: {a.teamName}
                    </li>
                  ))}
                </ul>
                <p className="text-seal-text-secondary">
                  Issued {awardMutation.data.participationCertificatesIssued} participation certificates.
                </p>
              </div>
            )}
          </SealCard>
        </>
      )}
    </div>
  );
}
