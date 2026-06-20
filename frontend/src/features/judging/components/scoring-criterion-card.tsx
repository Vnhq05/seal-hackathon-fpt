"use client";

import { useState } from "react";
import type { ScoringCriterion } from "@/features/judging/types/judge.types";

const scoringCardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 12,
  padding: 24,
};

const scoreInputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)",
  width: 64,
  textAlign: "center",
  fontSize: 18,
  fontWeight: 700,
  borderRadius: 8,
  padding: "8px 0",
  color: "#0e1528",
  outline: "none",
};

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

interface ScoringCriterionCardProps {
  criterion: ScoringCriterion;
  score: number;
  feedback: string;
  onScoreChange: (value: number) => void;
  onFeedbackChange: (value: string) => void;
}

export function ScoringCriterionCard({
  criterion,
  score,
  feedback,
  onScoreChange,
  onFeedbackChange,
}: ScoringCriterionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const weightedPoints = (score * criterion.weight) / 100;

  const handleIncrement = () => {
    if (score < criterion.maxScore) onScoreChange(score + 1);
  };
  const handleDecrement = () => {
    if (score > 0) onScoreChange(score - 1);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const num = Math.min(Number(raw) || 0, criterion.maxScore);
    onScoreChange(num);
  };

  return (
    <div style={scoringCardStyle}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0e1528" }}>
          {criterion.name}
        </h3>
        <span
          className="rounded-md"
          style={{
            backgroundColor: "#eef2ff",
            color: "#38bdf8",
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Weight: {criterion.weight}%
        </span>
      </div>

      {/* What to look for */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1"
        style={{
          fontSize: 13,
          color: "#38bdf8",
          fontWeight: 500,
          background: "none",
          border: "none",
          cursor: "pointer",
          marginBottom: expanded ? 8 : 16,
          padding: 0,
        }}
      >
        What to look for
        <span style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
          <ChevronDownIcon />
        </span>
      </button>
      {expanded && (
        <p style={{ fontSize: 13, color: "#2dd4bf", lineHeight: "19.5px", marginBottom: 16 }}>
          {criterion.description}
        </p>
      )}

      {/* Score Input Row */}
      <div className="flex items-center gap-4" style={{ marginBottom: 16 }}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDecrement}
            className="flex items-center justify-center rounded-md"
            style={{
              width: 32,
              height: 32,
              border: "1px solid rgba(223,226,236,0.8)",
              backgroundColor: "#eef0f6",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 700,
              color: "#0e1528",
            }}
          >
            -
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={score}
            onChange={handleInputChange}
            style={scoreInputStyle}
          />
          <button
            type="button"
            onClick={handleIncrement}
            className="flex items-center justify-center rounded-md"
            style={{
              width: 32,
              height: 32,
              border: "1px solid rgba(223,226,236,0.8)",
              backgroundColor: "#eef0f6",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 700,
              color: "#0e1528",
            }}
          >
            +
          </button>
          <span style={{ fontSize: 13, color: "#8891a5", marginLeft: 4 }}>
            / {criterion.maxScore}
          </span>
        </div>

        <div
          className="rounded-md"
          style={{
            backgroundColor: "#f0fdf4",
            padding: "6px 12px",
            fontSize: 13,
            fontWeight: 600,
            color: "#047857",
          }}
        >
          {weightedPoints.toFixed(2)} pts
        </div>
      </div>

      {/* Feedback */}
      <textarea
        value={feedback}
        onChange={(e) => onFeedbackChange(e.target.value)}
        placeholder="Feedback (optional)"
        rows={3}
        style={{
          width: "100%",
          border: "1px solid rgba(223,226,236,0.8)",
          borderRadius: 8,
          padding: 12,
          fontSize: 13,
          color: "#0e1528",
          resize: "vertical",
          outline: "none",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}
