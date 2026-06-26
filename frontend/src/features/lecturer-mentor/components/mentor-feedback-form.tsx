"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/axios";

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5", letterSpacing: "0.24px",
  lineHeight: "12px", marginBottom: 6, display: "block",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8, outline: "none", color: "#0e1528", backgroundColor: "#ffffff",
};

export function MentorFeedbackForm() {
  const router = useRouter();
  const [teamId, setTeamId] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = teamId.trim() && subject.trim() && content.trim() && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await apiClient.post("/mentor/feedback", { teamId, subject, content });
      router.push("/lecturer/teams");
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          New Feedback
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Submit feedback for a team you are mentoring.
        </p>
      </div>

      <div
        className="rounded-lg"
        style={{ backgroundColor: "#ffffff", border: "1px solid rgba(223,226,236,0.8)", padding: 32, maxWidth: 640 }}
      >
        <div className="flex flex-col gap-5">
          <div>
            <label style={labelStyle}>Team ID *</label>
            <input
              type="text"
              placeholder="Enter team ID..."
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Subject *</label>
            <input
              type="text"
              placeholder="Brief summary of your feedback..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Feedback Content *</label>
            <textarea
              placeholder="Write your detailed feedback..."
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
        </div>

        <div className="flex gap-3" style={{ marginTop: 24 }}>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-lg"
            style={{
              padding: "10px 24px", fontSize: 14, fontWeight: 600,
              backgroundColor: canSubmit ? "#38bdf8" : "#dfe2ec",
              color: canSubmit ? "#dfe2ec" : "#2dd4bf",
              border: "none", cursor: canSubmit ? "pointer" : "default",
            }}
          >
            {submitting ? "Submitting..." : "Submit Feedback"}
          </button>
          <button
            onClick={() => router.back()}
            className="rounded-lg"
            style={{ padding: "10px 24px", fontSize: 14, fontWeight: 600, backgroundColor: "#ffffff", color: "#0e1528", border: "1px solid rgba(223,226,236,0.8)", cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
