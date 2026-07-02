"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TrackResponse } from "@/lib/api/track.api";
import { trackAssignmentApi } from "@/lib/api/track-assignment.api";
import { useTrackDrawSession } from "@/features/coordinator/hooks/use-track-draw-session";
import { SealCard } from "@/shared/ui/seal-card";
import { SealButton } from "@/shared/ui/seal-button";

function formatDt(iso: string | null | undefined): string {
  if (!iso) return "—";
  return iso.slice(0, 16).replace("T", " ");
}

export function SealDrawSessionPanel({
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

export function GenericDrawPanel({
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
