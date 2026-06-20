"use client";

import { SubmitProjectForm } from "@/features/submissions/components/submit-project-form";

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8,
  padding: "32px 28px",
  boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
};

interface SubmitProjectPageProps {
  roundId: string;
  roundName?: string;
}

export function SubmitProjectPage({ roundId, roundName }: SubmitProjectPageProps) {
  return (
    <div className="flex justify-center px-4 py-10">
      <div className="w-full" style={{ maxWidth: 640 }}>
        <div style={cardStyle}>
          <SubmitProjectForm roundId={roundId} roundName={roundName} />
        </div>
      </div>
    </div>
  );
}
