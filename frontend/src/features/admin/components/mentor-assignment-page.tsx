"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAdminEvents, useAdminEvent } from "@/features/admin/hooks/use-admin-hackathons";
import {
  useMentorAssignments,
  useAllTrackMentorAssignments,
  useAssignMentor,
  useRemoveMentor,
} from "@/features/admin/hooks/use-admin-assignments";
import { useLecturerOptions } from "@/features/admin/hooks/use-lecturer-options";
import { trackApi } from "@/lib/api/track.api";
import type { MentorAssignmentResponse } from "@/lib/api";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5",
  letterSpacing: "0.24px", lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};
const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none",
};

function MentorRow({ m, eventId, trackId }: { m: MentorAssignmentResponse; eventId: string; trackId: string }) {
  const { mutate: remove } = useRemoveMentor(eventId, trackId);
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{m.mentorFullName ?? "Unknown"}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{m.mentorEmail ?? "N/A"}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{m.trackName ?? "N/A"}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{new Date(m.assignedAt).toLocaleDateString()}</td>
      <td style={bodyCell}>
        <button
          onClick={() => remove(m.id)}
          style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", background: "none", border: "none", cursor: "pointer" }}
        >
          Remove
        </button>
      </td>
    </tr>
  );
}

export function MentorAssignmentPage({ defaultEventId }: { defaultEventId?: string } = {}) {
  const [eventId, setEventId] = useState(defaultEventId ?? "");
  const [trackId, setTrackId] = useState("");
  const [mentorUserId, setMentorUserId] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);

  const { data: eventsPage } = useAdminEvents();
  const { data: defaultEvent } = useAdminEvent(defaultEventId ?? "");
  const { data: lecturers = [] } = useLecturerOptions();
  const { data: tracks = [] } = useQuery({
    queryKey: ["tracks", eventId],
    queryFn: () => trackApi.list(eventId),
    enabled: !!eventId,
  });
  const { data: mentors, isLoading } = useMentorAssignments(eventId, trackId);
  const { mutate: assign, isPending } = useAssignMentor(eventId, trackId);
  const trackIds = tracks.map((t) => t.id);
  const allTrackMentorQueries = useAllTrackMentorAssignments(eventId, trackIds);

  const mentorTrackConflict = useMemo(() => {
    const map = new Map<string, string>();
    tracks.forEach((track, i) => {
      if (track.id === trackId) return;
      for (const m of allTrackMentorQueries[i]?.data ?? []) {
        map.set(m.mentorUserId, track.name);
      }
    });
    return map;
  }, [tracks, trackId, allTrackMentorQueries]);

  const events = eventsPage?.content ?? [];
  const mentorList = mentors ?? [];

  const handleAssign = () => {
    if (mentorUserId && eventId && trackId) {
      setAssignError(null);
      assign(
        { mentorUserId },
        {
          onSuccess: () => setMentorUserId(""),
          onError: (err: Error) => setAssignError(err.message),
        },
      );
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Mentor Assignment
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Assign mentors to tracks within events.
        </p>
      </div>

      <div className="flex items-end gap-3 p-5 mb-6 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <div className="flex flex-col">
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Event</label>
          {defaultEventId ? (
            <span style={{ ...inputStyle, display: "inline-block", backgroundColor: "#f6f7fb", color: "#0e1528" }}>
              {defaultEvent?.name ?? defaultEventId}
            </span>
          ) : (
            <select value={eventId} onChange={(e) => { setEventId(e.target.value); setTrackId(""); }} style={inputStyle}>
              <option value="">Select event</option>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          )}
        </div>
        <div className="flex flex-col">
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Track</label>
          <select value={trackId} onChange={(e) => setTrackId(e.target.value)} style={inputStyle} disabled={!eventId}>
            <option value="">Select track</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.topic ?? "No topic yet"}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Mentor</label>
          <select
            value={mentorUserId}
            onChange={(e) => setMentorUserId(e.target.value)}
            style={inputStyle}
            disabled={!eventId || !trackId}
          >
            <option value="">Select mentor...</option>
            {lecturers.map((l) => {
              const conflictTrack = mentorTrackConflict.get(l.id);
              return (
                <option key={l.id} value={l.id}>
                  {l.fullName ?? l.email}
                  {conflictTrack ? ` — ⚠ Already in ${conflictTrack}` : ""}
                </option>
              );
            })}
          </select>
        </div>
        {assignError && (
          <p style={{ fontSize: 12, color: "#991b1b", alignSelf: "center" }}>{assignError}</p>
        )}
        <button
          onClick={handleAssign}
          disabled={isPending || !mentorUserId || !eventId || !trackId}
          className="border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer"
        >
          Assign
        </button>
      </div>

      <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={headerCell}>Mentor Name</th>
              <th style={headerCell}>Email</th>
              <th style={headerCell}>Track</th>
              <th style={headerCell}>Assigned At</th>
              <th style={{ ...headerCell, width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} style={{ padding: "14px 16px" }}><div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} /></td>
                  ))}</tr>
                ))
              : mentorList.map((m) => <MentorRow key={m.id} m={m} eventId={eventId} trackId={trackId} />)
            }
            {!isLoading && mentorList.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                  {eventId && trackId ? "No mentor assignments for this track." : "Select an event and track to view assignments."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
