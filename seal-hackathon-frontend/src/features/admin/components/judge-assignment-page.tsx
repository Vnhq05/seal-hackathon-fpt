"use client";

import { useState } from "react";
import { useJudgeAssignments, useAssignJudge, useUnassignJudge } from "@/features/admin/hooks/use-admin-assignments";
import type { JudgeAssignment } from "@/features/admin/types/admin-assignment.types";

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

function JudgeRow({ j }: { j: JudgeAssignment }) {
  const { mutate: unassign } = useUnassignJudge();

  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{j.judgeName}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{j.judgeEmail}</td>
      <td style={bodyCell}>
        <div className="flex flex-wrap gap-1">
          {j.assignedRounds.map((r) => (
            <span
              key={r.roundId}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1"
              style={{ fontSize: 11, fontWeight: 600, backgroundColor: "#eef2ff", color: "#4338ca" }}
            >
              {r.roundName}
              <button
                onClick={() => unassign({ judgeId: j.judgeId, roundId: r.roundId })}
                style={{ fontSize: 14, color: "#4338ca", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
              >
                x
              </button>
            </span>
          ))}
          {j.assignedRounds.length === 0 && <span style={{ color: "#8891a5", fontSize: 13 }}>None</span>}
        </div>
      </td>
      <td style={bodyCell}>{j.submissionsCount}</td>
    </tr>
  );
}

export function JudgeAssignmentPage() {
  const { data, isLoading } = useJudgeAssignments();
  const { mutate: assign, isPending } = useAssignJudge();
  const [judgeId, setJudgeId] = useState("");
  const [roundId, setRoundId] = useState("");
  const judges = data?.data ?? [];

  const handleAssign = () => {
    if (judgeId && roundId) {
      assign({ judgeId, roundId }, { onSuccess: () => { setJudgeId(""); setRoundId(""); } });
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Judge Assignment
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Assign and unassign judges to rounds.
        </p>
      </div>

      <div className="flex items-end gap-3 rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", padding: 20, marginBottom: 24 }}>
        <div className="flex flex-col">
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Judge ID</label>
          <input value={judgeId} onChange={(e) => setJudgeId(e.target.value)} style={inputStyle} placeholder="Enter judge ID" />
        </div>
        <div className="flex flex-col">
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Round ID</label>
          <input value={roundId} onChange={(e) => setRoundId(e.target.value)} style={inputStyle} placeholder="Enter round ID" />
        </div>
        <button
          onClick={handleAssign}
          disabled={isPending || !judgeId || !roundId}
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
              <th style={headerCell}>Judge Name</th>
              <th style={headerCell}>Email</th>
              <th style={headerCell}>Assigned Rounds</th>
              <th style={{ ...headerCell, width: 120 }}>Submissions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 4 }).map((_, j) => (
                    <td key={j} style={{ padding: "14px 16px" }}><div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} /></td>
                  ))}</tr>
                ))
              : judges.map((j) => <JudgeRow key={j.id} j={j} />)
            }
            {!isLoading && judges.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                  No judge assignments.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
