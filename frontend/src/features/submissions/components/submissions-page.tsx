"use client";

import { useMySubmissions } from "@/features/submissions/hooks/use-my-submissions";
import type { SubmissionResponse, SubmissionStatus } from "@/lib/api";

const STATUS_STYLE: Record<SubmissionStatus, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: "#eef0f6", text: "#2dd4bf", label: "Draft" },
  SUBMITTED: { bg: "#ecfdf5", text: "#047857", label: "Submitted" },
  SCORED: { bg: "#dbeafe", text: "#1e40af", label: "Scored" },
  NOT_SCORED: { bg: "#fef3c7", text: "#92400e", label: "Not Scored" },
};

const metaStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#8891a5",
  letterSpacing: "0.24px",
  lineHeight: "12px",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg" style={{ border: "1px solid rgba(198,198,205,0.3)", height: 140, backgroundColor: "#fafafa" }} />
  );
}

function SubmissionCard({ submission }: { submission: SubmissionResponse }) {
  const status = STATUS_STYLE[submission.status] ?? STATUS_STYLE.DRAFT;
  return (
    <div
      className="flex flex-col gap-3 rounded-lg p-6"
      style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", lineHeight: "25.2px" }}>
            Submission v{submission.currentVersion}
          </h3>
          <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "20px", marginTop: 2 }}>
            Round: {submission.roundId}
          </p>
        </div>
        <span
          className="rounded-md px-2 py-1"
          style={{ ...metaStyle, backgroundColor: status.bg, color: status.text }}
        >
          {status.label}
        </span>
      </div>

      <div
        className="flex items-center gap-4 pt-3"
        style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}
      >
        <span className="flex items-center gap-1">
          <svg width="12" height="13" viewBox="0 0 12 13" fill="none" aria-hidden="true">
            <rect x="1" y="2.5" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M1 5.5h10M4 1v2M8 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span style={metaStyle}>{formatDate(submission.createdAt)}</span>
        </span>
        <span className="flex items-center gap-1">
          <span style={metaStyle}>Versions: {submission.totalVersions}</span>
        </span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg py-16 text-center"
      style={{ border: "1px dashed rgba(223,226,236,0.8)", backgroundColor: "#fafafa" }}
    >
      <svg width="36" height="40" viewBox="0 0 36 40" fill="none" aria-hidden="true" className="mb-4">
        <path d="M22 2H8a4 4 0 00-4 4v28a4 4 0 004 4h20a4 4 0 004-4V12L22 2z" stroke="rgba(223,226,236,0.8)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M22 2v10h10M12 22h12M12 28h8" stroke="rgba(223,226,236,0.8)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>No submissions yet</p>
      <p className="mt-1" style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px" }}>
        Submit your project in an active hackathon to see it here.
      </p>
    </div>
  );
}

interface SubmissionsPageProps {
  roundId?: string;
}

export function SubmissionsPage({ roundId }: SubmissionsPageProps) {
  const { data, isLoading } = useMySubmissions(roundId);
  const submissions = data ?? [];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          My Submissions
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Track your project submissions and review status.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
          : submissions.length === 0
            ? <EmptyState />
            : submissions.map((s) => <SubmissionCard key={s.id} submission={s} />)
        }
      </div>
    </div>
  );
}
