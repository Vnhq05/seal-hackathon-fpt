"use client";

import { useState } from "react";
import { useAdminEvents } from "@/features/admin/hooks/use-admin-hackathons";
import { useMentorAssignments, useAssignMentor, useRemoveMentor } from "@/features/admin/hooks/use-admin-assignments";
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

function MentorRow({ m, eventId }: { m: MentorAssignmentResponse; eventId: string }) {
  const { mutate: remove } = useRemoveMentor(eventId);
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{m.mentorFullName ?? "Unknown"}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{m.mentorEmail ?? "N/A"}</td>
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

export function MentorAssignmentPage() {
  const [eventId, setEventId] = useState("");
  const [mentorUserId, setMentorUserId] = useState("");

  const { data: eventsPage } = useAdminEvents();
  const { data: mentors, isLoading } = useMentorAssignments(eventId);
  const { mutate: assign, isPending } = useAssignMentor(eventId);

  const events = eventsPage?.content ?? [];
  const mentorList = mentors ?? [];

  const handleAssign = () => {
    if (mentorUserId && eventId) {
      assign({ mentorUserId }, { onSuccess: () => setMentorUserId("") });
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Mentor Assignment
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Assign mentors to events.
        </p>
      </div>

      <div className="flex items-end gap-3 p-5 mb-6 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <div className="flex flex-col">
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Event</label>
          <select value={eventId} onChange={(e) => setEventId(e.target.value)} style={inputStyle}>
            <option value="">Select event</option>
            {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Mentor User ID</label>
          <input value={mentorUserId} onChange={(e) => setMentorUserId(e.target.value)} style={inputStyle} placeholder="Enter mentor user ID" />
        </div>
        <button
          onClick={handleAssign}
          disabled={isPending || !mentorUserId || !eventId}
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
              <th style={headerCell}>Assigned At</th>
              <th style={{ ...headerCell, width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 4 }).map((_, j) => (
                    <td key={j} style={{ padding: "14px 16px" }}><div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} /></td>
                  ))}</tr>
                ))
              : mentorList.map((m) => <MentorRow key={m.id} m={m} eventId={eventId} />)
            }
            {!isLoading && mentorList.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                  {eventId ? "No mentor assignments for this event." : "Select an event to view assignments."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
