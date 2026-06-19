"use client";

import { useRoundInfo } from "@/features/submissions/hooks/use-round-info";
import { SubmitProjectForm } from "@/features/submissions/components/submit-project-form";

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8,
  padding: "32px 28px",
  boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
};

interface SubmitProjectPageProps {
  hackathonId: string;
}

export function SubmitProjectPage({ hackathonId }: SubmitProjectPageProps) {
  const { data: roundInfo, isLoading, isError } = useRoundInfo(hackathonId);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-8 w-8 animate-spin rounded-full"
            style={{
              border: "2px solid rgba(223,226,236,0.8)",
              borderTopColor: "#38bdf8",
            }}
          />
          <p style={{ fontSize: 14, color: "#8891a5" }}>
            Loading round information...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !roundInfo) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p style={{ fontSize: 18, fontWeight: 600, color: "#0e1528" }}>
            Unable to load round info
          </p>
          <p style={{ fontSize: 14, color: "#8891a5" }}>
            The hackathon or current round could not be found. Please try
            again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center px-4 py-10">
      <div className="w-full" style={{ maxWidth: 640 }}>
        <div style={cardStyle}>
          <SubmitProjectForm roundInfo={roundInfo} />
        </div>
      </div>
    </div>
  );
}
