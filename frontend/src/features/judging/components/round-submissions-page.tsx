"use client";

import { useState } from "react";
import Link from "next/link";
import { useRoundSubmissions } from "@/features/judging/hooks/use-round-submissions";
import { usePortalBase } from "@/shared/hooks/use-portal-base";
import type { SubmissionFilterTab, RoundSubmission } from "@/features/judging/types/judge.types";

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(198,198,205,0.5)",
  borderRadius: 12,
};

const tabs: { key: SubmissionFilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unscored", label: "Unscored" },
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "locked", label: "Locked" },
];

function SkeletonBlock({ height }: { height: number }) {
  return (
    <div className="animate-pulse rounded-lg" style={{ height, backgroundColor: "rgba(223,226,236,0.8)" }} />
  );
}

function statusLabel(status: RoundSubmission["status"]): string {
  switch (status) {
    case "NOT_STARTED":
      return "Unscored";
    case "IN_PROGRESS":
      return "Draft";
    case "COMPLETED":
      return "Submitted";
    case "LOCKED":
      return "Locked";
    default:
      return status;
  }
}

function StatusBadge({ status }: { status: RoundSubmission["status"] }) {
  const colors: Record<RoundSubmission["status"], { bg: string; fg: string }> = {
    NOT_STARTED: { bg: "#fef3c7", fg: "#92400e" },
    IN_PROGRESS: { bg: "#e0f2fe", fg: "#0369a1" },
    COMPLETED: { bg: "#ecfdf5", fg: "#047857" },
    LOCKED: { bg: "#f3f4f6", fg: "#374151" },
  };
  const { bg, fg } = colors[status] ?? colors.NOT_STARTED;

  return (
    <span
      className="rounded-md"
      style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, backgroundColor: bg, color: fg }}
    >
      {statusLabel(status)}
    </span>
  );
}

function SubmissionRow({
  submission,
  roundId,
}: {
  submission: RoundSubmission;
  roundId: string;
}) {
  const portalBase = usePortalBase();
  const canScore =
    submission.scoringAllowed &&
    !submission.conflictOfInterest &&
    submission.status === "NOT_STARTED";

  return (
    <tr style={{ borderBottom: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600, color: "#0e1528" }}>
        {submission.teamName}
      </td>
      <td style={{ padding: "14px 16px", fontSize: 13, color: "#0e1528" }}>
        {submission.trackName ?? "—"}
      </td>
      <td style={{ padding: "14px 16px", fontSize: 13, color: "#0e1528" }}>
        {submission.groupName ?? "—"}
      </td>
      <td style={{ padding: "14px 16px", fontSize: 14, color: "#0e1528" }}>
        {submission.score !== null ? `${submission.score}/${submission.maxScore}` : "—"}
      </td>
      <td style={{ padding: "14px 16px" }}>
        <StatusBadge status={submission.status} />
      </td>
      <td style={{ padding: "14px 16px", fontSize: 13, color: "#2dd4bf" }}>
        {submission.submittedAt
          ? new Date(submission.submittedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—"}
      </td>
      <td style={{ padding: "14px 16px" }}>
        <Link
          href={`${portalBase}/scoring/${submission.teamId}/${roundId}`}
          className="inline-block rounded-lg"
          style={{
            backgroundColor: canScore ? "#38bdf8" : "#dfe2ec",
            color: canScore ? "#dfe2ec" : "#0e1528",
            padding: "6px 16px",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {canScore ? "Score" : "View"}
        </Link>
      </td>
    </tr>
  );
}

export function RoundSubmissionsPage({ roundId }: { roundId: string }) {
  const [activeTab, setActiveTab] = useState<SubmissionFilterTab>("all");
  const { data, isLoading } = useRoundSubmissions(roundId, { filter: activeTab });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" style={{ padding: 32 }}>
        <SkeletonBlock height={32} />
        <SkeletonBlock height={300} />
      </div>
    );
  }

  const submissions = data?.data ?? [];

  return (
    <div className="flex flex-col gap-6" style={{ padding: 32 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.24px" }}>
          {data?.roundName ?? "Round"}
        </h1>
        <p style={{ fontSize: 14, color: "#2dd4bf", marginTop: 4 }}>
          {data?.hackathonName ?? ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="rounded-lg"
            style={{
              padding: "8px 20px",
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: activeTab === t.key ? "#38bdf8" : "#dfe2ec",
              color: activeTab === t.key ? "#dfe2ec" : "#0e1528",
              border: "none",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={cardStyle} className="overflow-hidden">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6", borderBottom: "1px solid rgba(198,198,205,0.5)" }}>
              {["Team", "Track", "Group", "Score", "Status", "Submitted", "Action"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 16px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#2dd4bf",
                    textAlign: "left",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ padding: 32, textAlign: "center", fontSize: 14, color: "#8891a5" }}
                >
                  No submissions found.
                </td>
              </tr>
            ) : (
              submissions.map((s) => (
                <SubmissionRow key={s.id} submission={s} roundId={roundId} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
