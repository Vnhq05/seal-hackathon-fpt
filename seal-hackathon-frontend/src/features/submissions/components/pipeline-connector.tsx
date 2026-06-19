import type { PipelineRoundStatus } from "@/features/submissions/types/submission.types";
import { CheckCircleIcon, PencilIcon, LockIcon } from "./pipeline-icons";

interface PipelineConnectorProps {
  status: PipelineRoundStatus;
}

const baseStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "absolute",
  left: -34,
  top: 16,
};

export function PipelineConnector({ status }: PipelineConnectorProps) {
  if (status === "not_submitted") {
    return (
      <div
        style={{
          ...baseStyle,
          backgroundColor: "#38bdf8",
          boxShadow: "0 0 0 4px #06110f",
        }}
      >
        <PencilIcon size={13} color="#ffffff" />
      </div>
    );
  }

  if (status === "submitted") {
    return (
      <div
        style={{
          ...baseStyle,
          backgroundColor: "#eef0f6",
          border: "2px solid #c4c6d1",
          padding: 2,
        }}
      >
        <CheckCircleIcon size={15} color="#c4c6d1" />
      </div>
    );
  }

  return (
    <div
      style={{
        ...baseStyle,
        backgroundColor: "#dcfce7",
        border: "2px solid rgba(223,226,236,0.8)",
        padding: 2,
      }}
    >
      <LockIcon size={12} color="rgba(101,217,243,0.2)" />
    </div>
  );
}
