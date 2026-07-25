"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { StaffAssignmentNav } from "@/shared/components/staff-assignment-nav";
import { useAdminEvents, useAdminEvent } from "@/features/admin/hooks/use-admin-hackathons";
import {
  useMentorAssignments,
  useAllTrackMentorAssignments,
  useAssignMentor,
  useRemoveMentor,
  useMentorTeams,
  useDrawMentors,
  useAssignMentorToTeam,
  useRemoveMentorFromTeam,
  useEventStaffMentors,
} from "@/features/admin/hooks/use-admin-assignments";
import { trackApi } from "@/lib/api/track.api";
import { teamApi } from "@/lib/api/team.api";
import type { MentorAssignmentResponse, MentorTeamAssignmentResponse } from "@/lib/api";

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

function MentorPoolRow({ m, eventId, trackId }: { m: MentorAssignmentResponse; eventId: string; trackId: string }) {
  const { mutate: remove } = useRemoveMentor(eventId, trackId);
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{m.mentorFullName ?? "Unknown"}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{m.mentorEmail ?? "N/A"}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{m.trackName ?? "N/A"}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{new Date(m.assignedAt).toLocaleDateString()}</td>
      <td style={bodyCell}>
        <button
          type="button"
          onClick={() => remove(m.id)}
          style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", background: "none", border: "none", cursor: "pointer" }}
        >
          Remove
        </button>
      </td>
    </tr>
  );
}

function MentorTeamRow({ row, eventId }: { row: MentorTeamAssignmentResponse; eventId: string }) {
  const { mutate: remove } = useRemoveMentorFromTeam(eventId);
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{row.teamName}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{row.trackName ?? "—"}</td>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{row.mentorFullName ?? "Unknown"}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{row.mentorEmail ?? "N/A"}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{new Date(row.assignedAt).toLocaleDateString()}</td>
      <td style={bodyCell}>
        <button
          type="button"
          onClick={() => remove(row.id)}
          style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", background: "none", border: "none", cursor: "pointer" }}
        >
          Remove
        </button>
      </td>
    </tr>
  );
}

export function MentorAssignmentPage({ defaultEventId, embedded }: { defaultEventId?: string; embedded?: boolean } = {}) {
  const userEmail = useAuthStore((s) => s.user?.email);
  const [eventId, setEventId] = useState(defaultEventId ?? "");
  const [trackId, setTrackId] = useState("");
  const [mentorUserId, setMentorUserId] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [drawMessage, setDrawMessage] = useState<string | null>(null);
  const [manualTeamId, setManualTeamId] = useState("");
  const [manualMentorId, setManualMentorId] = useState("");

  const { data: eventsPage } = useAdminEvents();
  const { data: defaultEvent } = useAdminEvent(defaultEventId ?? "");
  const { data: eventMentors = [] } = useEventStaffMentors(eventId);
  const { data: tracks = [] } = useQuery({
    queryKey: ["tracks", eventId, userEmail],
    queryFn: () => trackApi.list(eventId),
    enabled: !!eventId,
  });
  const { data: mentors, isLoading } = useMentorAssignments(eventId, trackId);
  const { mutate: assign, isPending } = useAssignMentor(eventId, trackId);
  const { data: mentorTeams = [], isLoading: loadingTeams } = useMentorTeams(eventId);
  const { mutate: drawMentors, isPending: drawing } = useDrawMentors(eventId);
  const { mutate: assignToTeam, isPending: assigningTeam } = useAssignMentorToTeam(eventId);

  const { data: teamsPage } = useQuery({
    queryKey: ["teams", eventId, "mentor-assign", userEmail],
    queryFn: () => teamApi.list(eventId, { page: 0, size: 200 }),
    enabled: !!eventId,
  });

  const teamsNeedingMentor = useMemo(() => {
    const assigned = new Set(mentorTeams.map((m) => m.teamId));
    return (teamsPage?.content ?? []).filter(
      (t) => t.status !== "DISBANDED" && t.trackId && !assigned.has(t.id),
    );
  }, [teamsPage, mentorTeams]);

  const trackIds = tracks.map((t) => t.id);
  const allTrackMentorQueries = useAllTrackMentorAssignments(eventId, trackIds);

  const mentorsInSelectedTrack = useMemo(() => {
    if (!trackId) return [];
    return mentors ?? [];
  }, [mentors, trackId]);

  const mentorsForManualTeam = useMemo(() => {
    const team = teamsNeedingMentor.find((t) => t.id === manualTeamId);
    if (!team?.trackId) return [];
    const idx = tracks.findIndex((t) => t.id === team.trackId);
    if (idx < 0) return [];
    return allTrackMentorQueries[idx]?.data ?? [];
  }, [manualTeamId, teamsNeedingMentor, tracks, allTrackMentorQueries]);

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

  const inCurrentTrackPool = useMemo(
    () => new Set((mentors ?? []).map((m) => m.mentorUserId)),
    [mentors],
  );

  const availableEventMentors = useMemo(
    () => eventMentors.filter((m) => !inCurrentTrackPool.has(m.userId)),
    [eventMentors, inCurrentTrackPool],
  );

  const events = eventsPage?.content ?? [];
  const mentorList = mentors ?? [];

  const sortedMentorTeams = useMemo(() => {
    return [...mentorTeams].sort((a, b) => {
      const mentorCmp = (a.mentorFullName ?? a.mentorEmail ?? "").localeCompare(
        b.mentorFullName ?? b.mentorEmail ?? "",
        undefined,
        { sensitivity: "base" },
      );
      if (mentorCmp !== 0) return mentorCmp;
      return (a.teamName ?? "").localeCompare(b.teamName ?? "", undefined, {
        sensitivity: "base",
        numeric: true,
      });
    });
  }, [mentorTeams]);

  const handleAssignPool = () => {
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

  const handleDraw = () => {
    if (!eventId) return;
    if (!confirm("Randomly assign mentors to all teams that have a track but no mentor?")) return;
    setDrawMessage(null);
    setAssignError(null);
    drawMentors(undefined, {
      onSuccess: (result) => setDrawMessage(result.message),
      onError: (err: Error) => setAssignError(err.message),
    });
  };

  const handleManualTeamAssign = () => {
    if (!eventId || !manualTeamId || !manualMentorId) return;
    setAssignError(null);
    assignToTeam(
      { teamId: manualTeamId, mentorUserId: manualMentorId },
      {
        onSuccess: () => {
          setManualTeamId("");
          setManualMentorId("");
        },
        onError: (err: Error) => setAssignError(err.message),
      },
    );
  };

  return (
    <div>
      {!embedded && (
        <>
          <StaffAssignmentNav />
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
              Mentor Assignment
            </h1>
            <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
              Build the mentor pool per track, then randomly assign mentors to teams.
            </p>
          </div>
        </>
      )}

      {/* Pool assignment */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0e1528", marginBottom: 12 }}>1. Mentor pool (per track)</h2>
      <div className="flex flex-wrap items-end gap-3 p-5 mb-4 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <div className="flex flex-col">
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Event</label>
          {defaultEventId ? (
            <span style={{ ...inputStyle, display: "inline-block", backgroundColor: "#f6f7fb", color: "#0e1528" }}>
              {defaultEvent?.name ?? defaultEventId}
            </span>
          ) : (
            <select value={eventId} onChange={(e) => { setEventId(e.target.value); setTrackId(""); setMentorUserId(""); setDrawMessage(null); }} style={inputStyle}>
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
            {availableEventMentors.map((m) => {
              const conflictTrack = mentorTrackConflict.get(m.userId);
              return (
                <option key={m.userId} value={m.userId}>
                  {m.fullName ?? m.email}
                  {conflictTrack ? ` — ⚠ Already in ${conflictTrack}` : ""}
                </option>
              );
            })}
          </select>
        </div>
        <button
          type="button"
          onClick={handleAssignPool}
          disabled={isPending || !mentorUserId || !eventId || !trackId}
          className="border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer disabled:opacity-50"
        >
          Add to pool
        </button>
        {eventId && eventMentors.length === 0 && (
          <p style={{ fontSize: 12, color: "#92400e", width: "100%", margin: 0 }}>
            No event mentors yet. Add mentors on the event staff (Lecturers) tab first.
          </p>
        )}
        {eventId && eventMentors.length > 0 && availableEventMentors.length === 0 && trackId && (
          <p style={{ fontSize: 12, color: "#8891a5", width: "100%", margin: 0 }}>
            All event mentors are already in this track pool.
          </p>
        )}
      </div>

      <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] mb-8">
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
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} style={{ padding: "14px 16px" }}><div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} /></td>
                  ))}</tr>
                ))
              : mentorList.map((m) => <MentorPoolRow key={m.id} m={m} eventId={eventId} trackId={trackId} />)
            }
            {!isLoading && mentorList.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "32px 16px" }}>
                  {eventId && trackId ? "No mentors in this track pool." : "Select an event and track to view the pool."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Draw + team links */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0e1528" }}>2. Assign mentors to teams</h2>
        <button
          type="button"
          onClick={handleDraw}
          disabled={!eventId || drawing}
          className="border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer disabled:opacity-50"
        >
          {drawing ? "Drawing..." : "Draw mentors"}
        </button>
      </div>

      {(assignError || drawMessage) && (
        <p style={{ fontSize: 13, color: assignError ? "#991b1b" : "#166534", marginBottom: 12 }}>
          {assignError ?? drawMessage}
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3 p-5 mb-4 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <div className="flex flex-col">
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Team (needs mentor)</label>
          <select
            value={manualTeamId}
            onChange={(e) => { setManualTeamId(e.target.value); setManualMentorId(""); }}
            style={inputStyle}
            disabled={!eventId}
          >
            <option value="">Select team...</option>
            {teamsNeedingMentor.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Mentor (same track)</label>
          <select
            value={manualMentorId}
            onChange={(e) => setManualMentorId(e.target.value)}
            style={inputStyle}
            disabled={!manualTeamId}
          >
            <option value="">Select mentor...</option>
            {mentorsForManualTeam.map((m) => (
              <option key={m.mentorUserId} value={m.mentorUserId}>
                {m.mentorFullName ?? m.mentorEmail}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleManualTeamAssign}
          disabled={!manualTeamId || !manualMentorId || assigningTeam}
          className="border-2 border-navy bg-white px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer disabled:opacity-50"
        >
          {assigningTeam ? "Assigning..." : "Assign manually"}
        </button>
        <span style={{ fontSize: 12, color: "#8891a5", alignSelf: "center" }}>
          Pool size (selected track): {mentorsInSelectedTrack.length}
        </span>
      </div>

      <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={headerCell}>Team</th>
              <th style={headerCell}>Track</th>
              <th style={headerCell}>Mentor</th>
              <th style={headerCell}>Email</th>
              <th style={headerCell}>Assigned At</th>
              <th style={{ ...headerCell, width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingTeams
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} style={{ padding: "14px 16px" }}><div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} /></td>
                  ))}</tr>
                ))
              : sortedMentorTeams.map((row) => <MentorTeamRow key={row.id} row={row} eventId={eventId} />)
            }
            {!loadingTeams && sortedMentorTeams.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "32px 16px" }}>
                  {eventId
                    ? "No mentor–team links yet. Add mentors to track pools, then click Draw mentors."
                    : "Select an event to view mentor–team assignments."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
