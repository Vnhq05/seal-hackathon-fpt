"use client";

import type { PipelineRound } from "@/features/submissions/types/submission.types";
import {
  CalendarIcon,
  ArrowRightIcon,
  ClockIcon,
  CircleIcon,
  InfoClockIcon,
  UploadIcon,
} from "./pipeline-icons";
import {
  pipelineMetaStyle,
  STATUS_BADGE_STYLE,
  STATUS_LABEL,
  formatSubmittedDate,
} from "./pipeline-styles";

interface PipelineRoundCardProps {
  round: PipelineRound;
  onSubmit: (roundId: string) => void;
}

export function PipelineRoundCard({ round, onSubmit }: PipelineRoundCardProps) {
  const isActive = round.status === "not_submitted";
  const isLocked = round.status === "not_open";
  const isSubmitted = round.status === "submitted";

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#ffffff",
    border: isActive ? "2px solid #38bdf8" : "1px solid rgba(223,226,236,0.8)",
    borderRadius: 8,
    padding: isActive ? 26 : 25,
    opacity: isLocked ? 0.5 : 1,
    position: "relative",
    overflow: isActive ? "hidden" : undefined,
    boxShadow: isActive ? "0px 4px 20px -4px rgba(0,0,0,0.05)" : undefined,
  };

  return (
    <div style={cardStyle}>
      {isActive && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: "#38bdf8" }} />
      )}

      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", lineHeight: "25.2px", margin: 0 }}>
                {round.name}
              </h3>
              {isActive && round.timeRemaining && (
                <CountdownBadge timeRemaining={round.timeRemaining} />
              )}
            </div>
            <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", margin: 0 }}>
              {round.description}
            </p>
          </div>
          <span
            className="shrink-0 rounded-full px-3 py-1"
            style={{ ...pipelineMetaStyle, ...STATUS_BADGE_STYLE[round.status], whiteSpace: "nowrap" }}
          >
            {STATUS_LABEL[round.status]}
          </span>
        </div>

        {isActive && round.deliverables.length > 0 && (
          <DeliverablesSection deliverables={round.deliverables} />
        )}

        <div className="flex items-center justify-between" style={{ borderTop: "1px solid rgba(223,226,236,0.8)", paddingTop: 17 }}>
          {isSubmitted && <SubmittedFooter round={round} />}
          {isActive && (
            <div className="flex w-full items-center justify-end">
              <button
                type="button"
                onClick={() => onSubmit(round.id)}
                className="flex items-center gap-2 rounded"
                style={{ backgroundColor: "#38bdf8", color: "#0e1528", border: "none", padding: "10px 24px", fontSize: 12, fontWeight: 500, letterSpacing: "0.24px", lineHeight: "12px", cursor: "pointer" }}
              >
                <UploadIcon size={12} />
                Submit now
              </button>
            </div>
          )}
          {isLocked && (
            <div className="flex items-center gap-2">
              <InfoClockIcon />
              <span style={{ ...pipelineMetaStyle, color: "rgba(101,217,243,0.2)" }}>
                {round.lockedMessage ?? `Unlocks after Round ${round.roundNumber - 1} judging concludes`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CountdownBadge({ timeRemaining }: { timeRemaining: string }) {
  return (
    <span
      className="flex items-center gap-1 rounded-full px-2.5 py-0.5"
      style={{ backgroundColor: "#fcdeb5", fontSize: 12, fontWeight: 500, color: "#92400e", letterSpacing: "0.24px", lineHeight: "12px", whiteSpace: "nowrap" }}
    >
      <ClockIcon />
      Closes in {timeRemaining}
    </span>
  );
}

function DeliverablesSection({ deliverables }: { deliverables: PipelineRound["deliverables"] }) {
  return (
    <div className="flex flex-col gap-2 rounded-md p-4" style={{ backgroundColor: "#eef0f6", border: "1px solid rgba(223,226,236,0.8)" }}>
      <span style={{ ...pipelineMetaStyle, color: "#0e1528" }}>Required Deliverables:</span>
      {deliverables.map((d) => (
        <div key={d.id} className="flex items-center gap-2">
          <CircleIcon />
          <span style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function SubmittedFooter({ round }: { round: PipelineRound }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <CalendarIcon />
        <span style={pipelineMetaStyle}>{formatSubmittedDate(round.submittedAt)}</span>
      </div>
      {round.isScored && (
        <a
          href={round.scoreResultUrl ?? "#"}
          className="flex items-center gap-1"
          style={{ ...pipelineMetaStyle, color: "#0e1528", textDecoration: "none" }}
        >
          Scored — view results
          <ArrowRightIcon />
        </a>
      )}
    </>
  );
}
