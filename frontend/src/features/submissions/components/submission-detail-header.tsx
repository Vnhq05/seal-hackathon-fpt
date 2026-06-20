import type { SubmissionDetail } from "@/features/submissions/types/submission-detail.types";

interface SubmissionDetailHeaderProps {
  submission: SubmissionDetail;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  });
  return `${date} at ${time}`;
}

export function SubmissionDetailHeader({ submission }: SubmissionDetailHeaderProps) {
  const { submitter } = submission;

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{
        backgroundColor: "#eef0f6",
        border: "1px solid rgba(223,226,236,0.8)",
        padding: 25,
        boxShadow: "0px 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <div
        className="absolute bottom-0 left-0 top-0"
        style={{ width: 4, backgroundColor: "#10b981" }}
      />

      <div
        className="flex items-start justify-between"
        style={{ paddingLeft: 8 }}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-1"
              style={{ backgroundColor: "rgba(16,185,129,0.1)" }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M10 3L4.5 8.5 2 6"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#10b981",
                  letterSpacing: "0.24px",
                }}
              >
                {submission.status} - {submission.round}
              </span>
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#8891a5",
                letterSpacing: "0.24px",
              }}
            >
              ID: {submission.displayId}
            </span>
          </div>

          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#0e1528",
              lineHeight: "38.4px",
              letterSpacing: "-0.64px",
            }}
          >
            {submission.projectName}
          </h1>

          <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", maxWidth: 672 }}>
            {submission.description}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div
            className="flex items-center gap-2 rounded-lg"
            style={{
              backgroundColor: "#eef0f6",
              border: "1px solid rgba(223,226,236,0.8)",
              padding: "9px 17px",
            }}
          >
            <div className="flex flex-col items-end">
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#8891a5",
                  letterSpacing: "0.24px",
                }}
              >
                Submitted by
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#0e1528" }}>
                {submitter.name} ({submitter.team})
              </span>
            </div>
            <div
              className="flex shrink-0 items-center justify-center overflow-hidden rounded-full"
              style={{ width: 40, height: 40, border: "1px solid rgba(223,226,236,0.8)" }}
            >
              {submitter.avatarUrl ? (
                <img
                  src={submitter.avatarUrl}
                  alt={submitter.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ backgroundColor: "#38bdf8" }}
                >
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#8891a5" }}>
                    {submitter.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#8891a5",
              letterSpacing: "0.24px",
            }}
          >
            {formatDateTime(submitter.submittedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
