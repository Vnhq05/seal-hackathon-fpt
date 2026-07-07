"use client";

import { useState } from "react";
import type { EventResponse } from "@/lib/api";
import {
  useAdminTracks,
  useCreateTrack,
  useDeleteTrack,
} from "@/features/admin/hooks/use-admin-tracks";
import {
  useCompetitionGroups,
  useCreateCompetitionGroup,
  useDeleteCompetitionGroup,
} from "@/features/admin/hooks/use-admin-assignments";
import {
  bannerErrorStyle,
  errorStyle,
  inputStyle,
  isEventEditable,
  labelStyle,
} from "@/features/admin/components/event-edit/event-edit.utils";

const TRACK_MIN = 16;
const TRACK_MAX = 40;

function TrackCompetitionGroups({
  eventId,
  trackId,
  editable,
}: {
  eventId: string;
  trackId: string;
  editable: boolean;
}) {
  const { data: groups = [], isLoading } = useCompetitionGroups(eventId, trackId);
  const { mutate: createGroup, isPending: creating } = useCreateCompetitionGroup(eventId, trackId);
  const { mutate: deleteGroup, isPending: deleting } = useDeleteCompetitionGroup(eventId, trackId);
  const [groupName, setGroupName] = useState("");
  const [groupError, setGroupError] = useState<string | null>(null);

  const handleAddGroup = () => {
    if (!groupName.trim()) return;
    setGroupError(null);
    createGroup(groupName.trim(), {
      onSuccess: () => setGroupName(""),
      onError: (err) =>
        setGroupError(err instanceof Error ? err.message : "Failed to add group"),
    });
  };

  return (
    <div
      style={{
        marginTop: 8,
        padding: "10px 12px",
        backgroundColor: "#fff",
        borderRadius: 6,
        border: "1px solid rgba(223,226,236,0.8)",
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 700, color: "#4a5468", marginBottom: 8 }}>
        Competition Groups
      </p>

      {editable && (
        <div className="flex gap-2" style={{ marginBottom: 8 }}>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            style={{ ...inputStyle, flex: 1, fontSize: 13, padding: "8px 10px" }}
            placeholder="Group name (e.g. Group A1)"
          />
          <button
            type="button"
            onClick={handleAddGroup}
            disabled={creating}
            style={{
              backgroundColor: "#38bdf8",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {creating ? "Adding..." : "Add group"}
          </button>
        </div>
      )}
      {groupError && <p style={{ ...errorStyle, marginBottom: 8 }}>{groupError}</p>}

      {isLoading ? (
        <div
          className="animate-pulse rounded"
          style={{ height: 24, backgroundColor: "rgba(223,226,236,0.8)" }}
        />
      ) : groups.length === 0 ? (
        <p style={{ fontSize: 12, color: "#8891a5" }}>No groups yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {groups.map((g) => (
            <li
              key={g.id}
              className="flex items-center justify-between"
              style={{
                padding: "6px 0",
                borderBottom: "1px solid rgba(223,226,236,0.4)",
                fontSize: 13,
              }}
            >
              <span>{g.name}</span>
              {editable && (
                <button
                  type="button"
                  onClick={() => deleteGroup(g.id)}
                  disabled={deleting}
                  style={{
                    color: "#991b1b",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AddTracksTab({ event }: { event: EventResponse }) {
  const eventId = event.id;
  const editable = isEventEditable(event.status);

  const { data: tracks = [], isLoading } = useAdminTracks(eventId);
  const { mutate: createTrack, isPending: creating } = useCreateTrack(eventId);
  const { mutate: deleteTrack, isPending: deleting } = useDeleteTrack(eventId);

  const [trackName, setTrackName] = useState("");
  const [trackDescription, setTrackDescription] = useState("");
  const [trackMaxTeams, setTrackMaxTeams] = useState(20);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [expandedTrackIds, setExpandedTrackIds] = useState<Set<string>>(new Set());

  const toggleTrackGroups = (trackId: string) => {
    setExpandedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  };

  const handleAddTrack = () => {
    if (!trackName.trim()) return;
    if (trackMaxTeams < TRACK_MIN || trackMaxTeams > TRACK_MAX) {
      setTrackError(`Max teams must be between ${TRACK_MIN} and ${TRACK_MAX}`);
      return;
    }
    setTrackError(null);
    setActionError(null);
    createTrack(
      {
        name: trackName.trim(),
        description: trackDescription.trim() || undefined,
        maxTeams: trackMaxTeams,
      },
      {
        onSuccess: () => {
          setTrackName("");
          setTrackDescription("");
          setTrackMaxTeams(20);
        },
        onError: (err) => setActionError(err instanceof Error ? err.message : "Failed to add track"),
      },
    );
  };

  const handleRemoveTrack = (trackId: string) => {
    setActionError(null);
    deleteTrack(trackId, {
      onError: (err) => setActionError(err instanceof Error ? err.message : "Failed to remove track"),
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-[800px]">
      {!editable && (
        <div style={bannerErrorStyle}>
          Tracks cannot be modified while the event is active or completed.
        </div>
      )}

      <div className="flex flex-col gap-4 p-8 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0e1528" }}>Configure Tracks</h2>

        <div>
          <label style={labelStyle}>Add Track</label>
          <div className="flex gap-2" style={{ marginBottom: 4 }}>
            <input
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              disabled={!editable}
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Track name"
            />
            <input
              type="number"
              value={trackMaxTeams}
              onChange={(e) => setTrackMaxTeams(parseInt(e.target.value, 10) || TRACK_MIN)}
              disabled={!editable}
              style={{ ...inputStyle, width: 120 }}
              min={TRACK_MIN}
              max={TRACK_MAX}
              placeholder="Max teams"
            />
            <button
              type="button"
              onClick={handleAddTrack}
              disabled={!editable || creating}
              style={{
                backgroundColor: "#38bdf8",
                color: "#fff",
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                cursor: editable ? "pointer" : "not-allowed",
                fontSize: 14,
                fontWeight: 600,
                whiteSpace: "nowrap",
                opacity: editable ? 1 : 0.5,
              }}
            >
              {creating ? "Adding..." : "Add"}
            </button>
          </div>
          {trackError && <p style={errorStyle}>{trackError}</p>}
          <textarea
            value={trackDescription}
            onChange={(e) => setTrackDescription(e.target.value)}
            disabled={!editable}
            style={{ ...inputStyle, resize: "vertical", marginBottom: 8 }}
            rows={2}
            placeholder="Track description (optional)"
          />
        </div>

        {isLoading ? (
          <div className="animate-pulse rounded" style={{ height: 60, backgroundColor: "rgba(223,226,236,0.8)" }} />
        ) : tracks.length === 0 ? (
          <p style={{ fontSize: 13, color: "#8891a5" }}>No tracks yet. Add at least one track.</p>
        ) : (
          tracks.map((t) => (
            <div
              key={t.id}
              style={{
                padding: "10px 12px",
                backgroundColor: "#f8f9fc",
                borderRadius: 6,
                marginBottom: 4,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    {t.name} (max {t.maxTeams} teams)
                  </span>
                  {t.description && (
                    <p style={{ fontSize: 12, color: "#8891a5", marginTop: 2 }}>{t.description}</p>
                  )}
                  {t.assignedTeamCount != null && (
                    <p style={{ fontSize: 12, color: "#8891a5", marginTop: 2 }}>
                      {t.assignedTeamCount} teams assigned
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleTrackGroups(t.id)}
                    style={{
                      color: "#0e1528",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {expandedTrackIds.has(t.id) ? "Hide groups" : "Groups"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveTrack(t.id)}
                    disabled={!editable || deleting}
                    style={{
                      color: "#991b1b",
                      background: "none",
                      border: "none",
                      cursor: editable ? "pointer" : "not-allowed",
                      fontSize: 13,
                      fontWeight: 600,
                      opacity: editable ? 1 : 0.5,
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
              {expandedTrackIds.has(t.id) && (
                <TrackCompetitionGroups eventId={eventId} trackId={t.id} editable={editable} />
              )}
            </div>
          ))
        )}

        {actionError && <div style={bannerErrorStyle}>{actionError}</div>}
      </div>
    </div>
  );
}
