"use client";

import { useSubmissionPipeline } from "@/features/submissions/hooks/use-submission-pipeline";
import type { SubmissionResponse } from "@/lib/api";

function PipelineSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg"
          style={{
            height: i === 2 ? 260 : 140,
            backgroundColor: "rgba(223,226,236,0.8)",
            border: "1px solid rgba(198,198,205,0.3)",
          }}
        />
      ))}
    </div>
  );
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  SUBMITTED: { bg: "#ecfdf5", text: "#047857" },
  DRAFT: { bg: "#eef0f6", text: "#8891a5" },
  SCORED: { bg: "#dbeafe", text: "#1e40af" },
  NOT_SCORED: { bg: "#fef3c7", text: "#92400e" },
};

interface PipelinePageProps {
  roundId: string;
}

export function PipelinePage({ roundId }: PipelinePageProps) {
  const { data: submissions, isLoading, isError } = useSubmissionPipeline(roundId);

  if (isLoading) {
    return (
      <div style={{ padding: "32px 120px", maxWidth: 800 }}>
        <PipelineSkeleton />
      </div>
    );
  }

  if (isError || !submissions) {
    return (
      <div style={{ padding: "32px 120px" }}>
        <div
          className="flex flex-col items-center justify-center rounded-lg py-16"
          style={{ border: "1px dashed rgba(223,226,236,0.8)", backgroundColor: "#fafafa" }}
        >
          <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>
            Unable to load pipeline
          </p>
          <p
            style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px" }}
            className="mt-1"
          >
            Please make sure you are part of a team.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ padding: "32px 120px", maxWidth: 800 }}
      className="flex flex-col gap-8"
    >
      {/* Page Header */}
      <div className="flex flex-col gap-1.5">
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#0e1528",
            letterSpacing: "-0.64px",
            lineHeight: "38.4px",
            margin: 0,
          }}
        >
          Submission Pipeline
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#8891a5",
            lineHeight: "21px",
            margin: 0,
            maxWidth: 672,
          }}
        >
          Track your team&apos;s progress through the hackathon stages. Ensure
          all materials are uploaded before the deadlines.
        </p>
      </div>

      {/* Submissions list */}
      {submissions.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-lg py-16"
          style={{ border: "1px dashed rgba(223,226,236,0.8)", backgroundColor: "#fafafa" }}
        >
          <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>
            No submissions yet
          </p>
          <p style={{ fontSize: 14, color: "#8891a5", marginTop: 4 }}>
            Submit your project to see it here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {submissions.map((sub: SubmissionResponse) => {
            const statusStyle = STATUS_COLORS[sub.status] ?? STATUS_COLORS.DRAFT;
            return (
              <div
                key={sub.id}
                className="flex items-center justify-between rounded-lg p-5"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(198,198,205,0.5)",
                }}
              >
                <div className="flex flex-col gap-1">
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>
                    Submission v{sub.currentVersion}
                  </span>
                  <span style={{ fontSize: 12, color: "#8891a5" }}>
                    Team: {sub.teamId} | Versions: {sub.totalVersions}
                  </span>
                </div>
                <span
                  className="rounded-md px-2 py-1"
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.text,
                  }}
                >
                  {sub.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
