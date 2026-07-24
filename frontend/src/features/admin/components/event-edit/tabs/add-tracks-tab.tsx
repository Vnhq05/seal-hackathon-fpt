"use client";

import { useState } from "react";
import type { EventResponse } from "@/lib/api";
import {
  useAdminTracks,
  useCreateTrack,
  useDeleteTrack,
} from "@/features/admin/hooks/use-admin-tracks";
import {
  bannerErrorStyle,
  errorStyle,
  inputStyle,
  isEventEditable,
  labelStyle,
} from "@/features/admin/components/event-edit/event-edit.utils";

export function AddTracksTab({ event }: { event: EventResponse }) {
  const eventId = event.id;
  const editable = isEventEditable(event.status);

  const { data: tracks = [], isLoading } = useAdminTracks(eventId);
  const { mutate: createTrack, isPending: creating } = useCreateTrack(eventId);
  const { mutate: deleteTrack, isPending: deleting } = useDeleteTrack(eventId);

  const [trackName, setTrackName] = useState("");
  const [trackDescription, setTrackDescription] = useState("");
  const [trackError, setTrackError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleAddTrack = () => {
    if (!trackName.trim()) return;
    setTrackError(null);
    setActionError(null);
    createTrack(
      {
        name: trackName.trim(),
        description: trackDescription.trim() || undefined,
      },
      {
        onSuccess: () => {
          setTrackName("");
          setTrackDescription("");
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
              className="flex items-center justify-between"
              style={{
                padding: "10px 12px",
                backgroundColor: "#f8f9fc",
                borderRadius: 6,
                marginBottom: 4,
              }}
            >
              <div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</span>
                {t.description && (
                  <p style={{ fontSize: 12, color: "#8891a5", marginTop: 2 }}>{t.description}</p>
                )}
                {t.assignedTeamCount != null && (
                  <p style={{ fontSize: 12, color: "#8891a5", marginTop: 2 }}>
                    {t.assignedTeamCount} teams assigned
                  </p>
                )}
              </div>
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
          ))
        )}

        {actionError && <div style={bannerErrorStyle}>{actionError}</div>}
      </div>
    </div>
  );
}
