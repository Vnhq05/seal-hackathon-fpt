"use client";

import { useRouter } from "next/navigation";
import { useSubmissionPipeline } from "@/features/submissions/hooks/use-submission-pipeline";
import { PipelineRoundCard } from "./pipeline-round-card";
import { PipelineConnector } from "./pipeline-connector";
import { RefreshIcon, ExternalLinkIcon } from "./pipeline-icons";
import { pipelineMetaStyle, formatLastUpdated } from "./pipeline-styles";

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

export function PipelinePage() {
  const router = useRouter();
  const { data: pipeline, isLoading, isError } = useSubmissionPipeline();

  const handleSubmit = (roundId: string) => {
    router.push(`/participant/submissions/submit?roundId=${roundId}`);
  };

  if (isLoading) {
    return (
      <div style={{ padding: "32px 120px", maxWidth: 800 }}>
        <PipelineSkeleton />
      </div>
    );
  }

  if (isError || !pipeline) {
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
        <div className="flex items-center gap-2">
          <span
            className="rounded-sm px-2 py-0.5"
            style={{
              backgroundColor: "#e1e2ed",
              fontSize: 12,
              fontWeight: 500,
              color: "#191b24",
              letterSpacing: "0.6px",
              lineHeight: "12px",
              textTransform: "uppercase",
            }}
          >
            {pipeline.teamName}
          </span>
          <span style={pipelineMetaStyle}>•</span>
          <span style={pipelineMetaStyle}>{pipeline.hackathonName}</span>
        </div>
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

      {/* Stepper */}
      <div style={{ paddingLeft: 32, position: "relative" }}>
        {/* Vertical line */}
        <div
          style={{
            position: "absolute",
            left: 15,
            top: 16,
            bottom: 32,
            width: 2,
            backgroundColor: "rgba(223,226,236,0.8)",
          }}
        />

        <div className="flex flex-col gap-6">
          {pipeline.rounds.map((round) => (
            <div key={round.id} style={{ position: "relative" }}>
              <PipelineConnector status={round.status} />
              <PipelineRoundCard round={round} onSubmit={handleSubmit} />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(223,226,236,0.8)", paddingTop: 25 }}
      >
        <div className="flex items-center gap-2">
          <RefreshIcon />
          <span style={pipelineMetaStyle}>
            Last updated: {formatLastUpdated(pipeline.lastUpdatedAt)}
          </span>
        </div>
        <a
          href="/participant/support"
          className="flex items-center gap-1"
          style={{ ...pipelineMetaStyle, textDecoration: "none" }}
        >
          Need help?
          <ExternalLinkIcon />
        </a>
      </div>
    </div>
  );
}
