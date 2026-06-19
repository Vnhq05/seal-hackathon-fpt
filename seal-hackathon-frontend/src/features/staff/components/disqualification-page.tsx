"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDisqualifyTeam } from "@/features/staff/hooks/use-staff-teams";

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5", letterSpacing: "0.24px",
  lineHeight: "12px", marginBottom: 6, display: "block",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8, outline: "none", color: "#0e1528", backgroundColor: "#ffffff",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff", border: "1px solid rgba(223,226,236,0.8)", borderRadius: 12,
  boxShadow: "0px 1px 1px rgba(0,0,0,0.05)", padding: 32, maxWidth: 640,
};

export function DisqualificationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { mutate: disqualify, isPending } = useDisqualifyTeam();

  const teamId = searchParams.get("teamId") ?? "";
  const teamName = searchParams.get("teamName") ?? "";

  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = () => {
    if (!teamId || !reason.trim()) return;
    disqualify(
      { teamId, reason, evidence: evidence || undefined },
      { onSuccess: () => router.push("/staff/teams") },
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Disqualify Team
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Submit a disqualification request with supporting evidence.
        </p>
      </div>

      <div style={cardStyle}>
        {teamName && (
          <div style={{ marginBottom: 24 }}>
            <span style={labelStyle}>Team</span>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>{teamName}</p>
          </div>
        )}

        {!teamId && (
          <div style={{ marginBottom: 24 }}>
            <span style={labelStyle}>Team ID</span>
            <input
              type="text"
              placeholder="Enter team ID..."
              value={teamId}
              readOnly
              style={inputStyle}
            />
            <p style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>
              Navigate from Team Management to select a team.
            </p>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Reason for Disqualification *</label>
          <textarea
            placeholder="Describe the reason for disqualification..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div style={{ marginBottom: 32 }}>
          <label style={labelStyle}>Supporting Evidence</label>
          <textarea
            placeholder="Provide any supporting evidence, links, or references..."
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!teamId || !reason.trim() || isPending}
            className="rounded-lg"
            style={{
              padding: "10px 24px", fontSize: 14, fontWeight: 600,
              backgroundColor: !teamId || !reason.trim() ? "#dfe2ec" : "#dc2626",
              color: !teamId || !reason.trim() ? "#2dd4bf" : "#ffffff",
              border: "none", cursor: !teamId || !reason.trim() ? "default" : "pointer",
            }}
          >
            Disqualify Team
          </button>
          <button
            onClick={() => router.push("/staff/teams")}
            className="rounded-lg"
            style={{ padding: "10px 24px", fontSize: 14, fontWeight: 600, backgroundColor: "#ffffff", color: "#0e1528", border: "1px solid rgba(223,226,236,0.8)", cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50 }}
        >
          <div style={{ ...cardStyle, maxWidth: 480 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0e1528", marginBottom: 8 }}>
              Confirm Disqualification
            </h2>
            <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginBottom: 24 }}>
              Are you sure you want to disqualify <strong>{teamName || teamId}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-lg"
                style={{ padding: "8px 20px", fontSize: 14, fontWeight: 600, backgroundColor: "#ffffff", color: "#0e1528", border: "1px solid rgba(223,226,236,0.8)", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowConfirm(false); handleSubmit(); }}
                disabled={isPending}
                className="rounded-lg"
                style={{ padding: "8px 20px", fontSize: 14, fontWeight: 600, backgroundColor: "#dc2626", color: "#ffffff", border: "none", cursor: "pointer" }}
              >
                {isPending ? "Processing..." : "Confirm Disqualify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
