"use client";

import { useState } from "react";
import { useCalibrationSessions, useCreateCalibrationSession } from "@/features/admin/hooks/use-admin-system";
import type { CalibrationSession } from "@/features/admin/types/admin-analytics.types";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5",
  letterSpacing: "0.24px", lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};
const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};

const STATUS_STYLES: Record<CalibrationSession["status"], React.CSSProperties> = {
  PENDING: { backgroundColor: "#ffffff", color: "#2dd4bf" },
  IN_PROGRESS: { backgroundColor: "#fffbeb", color: "#92400e" },
  COMPLETED: { backgroundColor: "#f0fdf4", color: "#166534" },
};

function SessionRow({ s }: { s: CalibrationSession }) {
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{s.name}</td>
      <td style={bodyCell}>
        <span className="inline-flex rounded-full px-2 py-1" style={{ fontSize: 12, fontWeight: 600, ...STATUS_STYLES[s.status] }}>
          {s.status.replace("_", " ")}
        </span>
      </td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{new Date(s.createdAt).toLocaleDateString()}</td>
      <td style={bodyCell}>{s.judgeCount}</td>
      <td style={bodyCell}>{s.sampleCount}</td>
    </tr>
  );
}

function CreateForm({ onClose }: { onClose: () => void }) {
  const { mutate: create, isPending } = useCreateCalibrationSession();
  const [name, setName] = useState("");
  const [roundId, setRoundId] = useState("");
  const [judgeIds, setJudgeIds] = useState("");
  const [submissionIds, setSubmissionIds] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create(
      {
        name,
        roundId,
        judgeIds: judgeIds.split(",").map((s) => s.trim()).filter(Boolean),
        sampleSubmissionIds: submissionIds.split(",").map((s) => s.trim()).filter(Boolean),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 mb-6 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4 }}>Session Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="Calibration session name" required />
        </div>
        <div className="flex flex-col">
          <label style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4 }}>Round ID</label>
          <input value={roundId} onChange={(e) => setRoundId(e.target.value)} style={inputStyle} placeholder="Round ID" required />
        </div>
      </div>
      <div className="flex flex-col">
        <label style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4 }}>Judge IDs (comma-separated)</label>
        <input value={judgeIds} onChange={(e) => setJudgeIds(e.target.value)} style={inputStyle} placeholder="id1, id2, id3" required />
      </div>
      <div className="flex flex-col">
        <label style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4 }}>Sample Submission IDs (comma-separated)</label>
        <input value={submissionIds} onChange={(e) => setSubmissionIds(e.target.value)} style={inputStyle} placeholder="id1, id2" required />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={isPending} className="border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer">
          {isPending ? "Creating..." : "Create Session"}
        </button>
        <button type="button" onClick={onClose} className="border-2 border-navy bg-white px-6 py-2.5 text-sm font-medium text-navy cursor-pointer">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function CalibrationSessionPage() {
  const { data: rawData, isLoading } = useCalibrationSessions();
  const [showForm, setShowForm] = useState(false);
  // useCalibrationSessions returns never[] (stub), cast safely
  const sessions = (rawData ?? []) as CalibrationSession[];

  return (
    <div style={{ padding: 24 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
            Calibration Sessions
          </h1>
          <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
            Create calibration sessions for judges to compare scores.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer"
          >
            Create Session
          </button>
        )}
      </div>

      {showForm && <CreateForm onClose={() => setShowForm(false)} />}

      <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={headerCell}>Name</th>
              <th style={{ ...headerCell, width: 120 }}>Status</th>
              <th style={{ ...headerCell, width: 120 }}>Created</th>
              <th style={{ ...headerCell, width: 90 }}>Judges</th>
              <th style={{ ...headerCell, width: 90 }}>Samples</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} style={{ padding: "14px 16px" }}><div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "50%" }} /></td>
                  ))}</tr>
                ))
              : sessions.map((s) => <SessionRow key={s.id} s={s} />)
            }
            {!isLoading && sessions.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                  No calibration sessions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
