"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAdminEvents, useAdminEvent } from "@/features/admin/hooks/use-admin-hackathons";
import { useAdminRounds } from "@/features/admin/hooks/use-admin-rounds";
import { useJudgeAssignments, useAssignJudge, useRemoveJudge } from "@/features/admin/hooks/use-admin-assignments";
import { useLecturerOptions } from "@/features/admin/hooks/use-lecturer-options";
import { trackApi } from "@/lib/api/track.api";
import type { JudgeAssignmentResponse, RoundType } from "@/lib/api";

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

function PhaseTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 16px",
        fontSize: 13,
        fontWeight: 600,
        border: "none",
        borderBottom: active ? "2px solid #38bdf8" : "2px solid transparent",
        backgroundColor: "transparent",
        color: active ? "#0e1528" : "#8891a5",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function ReadinessBadge({ assigned, target }: { assigned: number; target: number }) {
  const ready = assigned >= target;
  return (
    <div className="flex items-center gap-2">
      <span style={{ fontSize: 13, color: "#8891a5" }}>
        {assigned} / {target} judges assigned
      </span>
      <span
        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
          ready ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
        }`}
      >
        {ready ? "Ready" : "Insufficient"}
      </span>
    </div>
  );
}

function JudgeRow({ j, eventId, roundId, trackId }: {
  j: JudgeAssignmentResponse; eventId: string; roundId: string; trackId?: string;
}) {
  const { mutate: remove } = useRemoveJudge(eventId, roundId, trackId);

  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{j.judgeFullName ?? "Unknown"}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{j.judgeEmail ?? "N/A"}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{j.trackName ?? "All finalists"}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{new Date(j.assignedAt).toLocaleDateString()}</td>
      <td style={bodyCell}>
        <button
          onClick={() => remove(j.id)}
          style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", background: "none", border: "none", cursor: "pointer" }}
        >
          Remove
        </button>
      </td>
    </tr>
  );
}

export function JudgeAssignmentPage({ defaultEventId }: { defaultEventId?: string } = {}) {
  const [eventId, setEventId] = useState(defaultEventId ?? "");
  const [phase, setPhase] = useState<Extract<RoundType, "PRELIMINARY" | "FINAL">>("PRELIMINARY");
  const [roundId, setRoundId] = useState("");
  const [trackId, setTrackId] = useState("");
  const [judgeUserId, setJudgeUserId] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);

  const { data: eventsPage } = useAdminEvents();
  const { data: defaultEvent } = useAdminEvent(defaultEventId ?? "");
  const { data: lecturers = [] } = useLecturerOptions();
  const { data: rounds } = useAdminRounds(eventId);
  const { data: tracks = [] } = useQuery({
    queryKey: ["tracks", eventId],
    queryFn: () => trackApi.list(eventId),
    enabled: !!eventId,
  });

  const roundsList = useMemo(() => rounds ?? [], [rounds]);
  const phaseRounds = useMemo(
    () => roundsList.filter((r) => r.roundType === phase),
    [roundsList, phase],
  );

  const activeRoundId = useMemo(() => {
    if (!eventId || phaseRounds.length === 0) return "";
    if (roundId && phaseRounds.some((r) => r.id === roundId)) return roundId;
    return phaseRounds[0].id;
  }, [eventId, phaseRounds, roundId]);

  const selectedRound = useMemo(
    () => roundsList.find((r) => r.id === activeRoundId),
    [roundsList, activeRoundId],
  );
  const isPreliminary = phase === "PRELIMINARY";
  const listTrackId = isPreliminary ? trackId : undefined;

  const { data: judges, isLoading } = useJudgeAssignments(eventId, activeRoundId, listTrackId, {
    requiresTrackId: isPreliminary,
  });
  const { mutate: assign, isPending } = useAssignJudge(eventId, activeRoundId);

  const events = eventsPage?.content ?? [];
  const judgeList = judges ?? [];

  const showReadiness =
    !!eventId &&
    !!activeRoundId &&
    !!selectedRound &&
    (!isPreliminary || !!trackId);

  const handleAssign = () => {
    if (judgeUserId && eventId && activeRoundId && (!isPreliminary || trackId)) {
      setAssignError(null);
      assign(
        { judgeUserId, ...(isPreliminary ? { trackId } : {}) },
        {
          onSuccess: () => setJudgeUserId(""),
          onError: (err: Error) => setAssignError(err.message),
        },
      );
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Judge Assignment
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Assign judges to rounds and tracks (preliminary) or final round (all finalists).
        </p>
      </div>

      <div className="flex flex-col gap-4 p-5 mb-6 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col">
            <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Event</label>
            {defaultEventId ? (
              <span style={{ ...inputStyle, display: "inline-block", backgroundColor: "#f6f7fb", color: "#0e1528" }}>
                {defaultEvent?.name ?? defaultEventId}
              </span>
            ) : (
              <select value={eventId} onChange={(e) => { setEventId(e.target.value); setRoundId(""); setTrackId(""); }} style={inputStyle}>
                <option value="">Select event</option>
                {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {eventId && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-2" style={{ borderBottom: "1px solid rgba(198,198,205,0.5)", paddingBottom: 1 }}>
                <PhaseTab
                  label="Preliminary Round"
                  active={phase === "PRELIMINARY"}
                  onClick={() => { setPhase("PRELIMINARY"); setTrackId(""); }}
                />
                <PhaseTab
                  label="Grand Final"
                  active={phase === "FINAL"}
                  onClick={() => { setPhase("FINAL"); setTrackId(""); }}
                />
              </div>
              {showReadiness && selectedRound && (
                <ReadinessBadge assigned={judgeList.length} target={selectedRound.judgeCount} />
              )}
            </div>

            {phaseRounds.length === 0 ? (
              <p style={{ fontSize: 13, color: "#8891a5" }}>
                No {phase === "PRELIMINARY" ? "preliminary" : "final"} round found for this event.
              </p>
            ) : (
              <div className="flex items-end gap-3 flex-wrap">
                {phaseRounds.length > 1 && (
                  <div className="flex flex-col">
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Round</label>
                    <select
                      value={activeRoundId}
                      onChange={(e) => { setRoundId(e.target.value); setTrackId(""); }}
                      style={inputStyle}
                    >
                      {phaseRounds.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {isPreliminary && (
                  <div className="flex flex-col">
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Track</label>
                    <select value={trackId} onChange={(e) => setTrackId(e.target.value)} style={inputStyle}>
                      <option value="">Select track</option>
                      {tracks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-end gap-3">
          <div className="flex flex-col">
            <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Judge</label>
            <select
              value={judgeUserId}
              onChange={(e) => setJudgeUserId(e.target.value)}
              style={inputStyle}
              disabled={!eventId || !activeRoundId || (isPreliminary && !trackId)}
            >
              <option value="">Select judge...</option>
              {lecturers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.fullName ?? l.email}
                </option>
              ))}
            </select>
          </div>
          {assignError && (
            <p style={{ fontSize: 12, color: "#991b1b", alignSelf: "center" }}>{assignError}</p>
          )}
          <button
            onClick={handleAssign}
            disabled={isPending || !judgeUserId || !eventId || !activeRoundId || (isPreliminary && !trackId)}
            className="border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer"
          >
            Assign
          </button>
        </div>
      </div>

      <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={headerCell}>Judge Name</th>
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
              : judgeList.map((j) => (
                  <JudgeRow key={j.id} j={j} eventId={eventId} roundId={activeRoundId} trackId={listTrackId} />
                ))
            }
            {!isLoading && judgeList.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                  {eventId && activeRoundId && phaseRounds.length > 0 && (!isPreliminary || trackId)
                    ? "No judge assignments for this scope."
                    : `Select event${isPreliminary ? ", track" : ""} to view assignments.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
