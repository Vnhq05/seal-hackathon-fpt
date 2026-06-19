"use client";

import { useState } from "react";
import { useMentorAssignments, useAssignMentor, useUnassignMentor } from "@/features/admin/hooks/use-admin-assignments";
import type { MentorAssignment } from "@/features/admin/types/admin-assignment.types";

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

function MentorRow({ m }: { m: MentorAssignment }) {
  const { mutate: unassign } = useUnassignMentor();
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{m.mentorName}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{m.mentorEmail}</td>
      <td style={bodyCell}>
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-1" style={{ fontSize: 11, fontWeight: 600, backgroundColor: "#f0fdf4", color: "#166534" }}>
          {m.trackName}
          <button
            onClick={() => unassign({ mentorId: m.mentorId, trackId: m.trackId })}
            style={{ fontSize: 14, color: "#166534", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
          >
            x
          </button>
        </span>
      </td>
      <td style={bodyCell}>{m.teamsCount}</td>
    </tr>
  );
}

export function MentorAssignmentPage() {
  const { data, isLoading } = useMentorAssignments();
  const { mutate: assign, isPending } = useAssignMentor();
  const [mentorId, setMentorId] = useState("");
  const [trackId, setTrackId] = useState("");
  const mentors = data?.data ?? [];

  const handleAssign = () => {
    if (mentorId && trackId) {
      assign({ mentorId, trackId }, { onSuccess: () => { setMentorId(""); setTrackId(""); } });
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Mentor Assignment
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Assign mentors to tracks.
        </p>
      </div>

      <div className="flex items-end gap-3 rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", padding: 20, marginBottom: 24 }}>
        <div className="flex flex-col">
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Mentor ID</label>
          <input value={mentorId} onChange={(e) => setMentorId(e.target.value)} style={inputStyle} placeholder="Enter mentor ID" />
        </div>
        <div className="flex flex-col">
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Track ID</label>
          <input value={trackId} onChange={(e) => setTrackId(e.target.value)} style={inputStyle} placeholder="Enter track ID" />
        </div>
        <button
          onClick={handleAssign}
          disabled={isPending || !mentorId || !trackId}
          className="rounded-lg"
          style={{ backgroundColor: "#38bdf8", padding: "9px 20px", color: "#ffffff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", opacity: isPending ? 0.7 : 1 }}
        >
          Assign
        </button>
      </div>

      <div className="overflow-hidden rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={headerCell}>Mentor Name</th>
              <th style={headerCell}>Email</th>
              <th style={headerCell}>Track</th>
              <th style={{ ...headerCell, width: 100 }}>Teams</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 4 }).map((_, j) => (
                    <td key={j} style={{ padding: "14px 16px" }}><div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} /></td>
                  ))}</tr>
                ))
              : mentors.map((m) => <MentorRow key={m.id} m={m} />)
            }
            {!isLoading && mentors.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                  No mentor assignments.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
