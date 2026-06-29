"use client";

import Link from "next/link";
import { useSubmissionDetail } from "@/features/submissions/hooks/use-submission-detail";
import { useSubmissionVersions } from "@/features/submissions/hooks/use-submission-versions";
import { resolveFileUrl } from "@/lib/files";

interface SubmissionDetailPageProps {
  roundId: string;
  submissionId: string;
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div
        className="animate-pulse rounded-lg"
        style={{ height: 180, backgroundColor: "rgba(223,226,236,0.8)" }}
      />
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-6">
          <div
            className="animate-pulse rounded-lg"
            style={{ height: 240, backgroundColor: "rgba(223,226,236,0.8)" }}
          />
        </div>
        <div className="col-span-1 flex flex-col gap-6">
          <div
            className="animate-pulse rounded-lg"
            style={{ height: 280, backgroundColor: "rgba(223,226,236,0.8)" }}
          />
        </div>
      </div>
    </div>
  );
}

export function SubmissionDetailPage({ roundId, submissionId }: SubmissionDetailPageProps) {
  const { data: submission, isLoading } = useSubmissionDetail(roundId, submissionId);
  const { data: versions } = useSubmissionVersions(roundId, submissionId);

  if (isLoading) return <PageSkeleton />;

  if (!submission) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p style={{ fontSize: 18, fontWeight: 600, color: "#0e1528" }}>
          Submission not found
        </p>
        <p style={{ fontSize: 14, color: "#8891a5", marginTop: 4 }}>
          The submission you are looking for does not exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/student/projects"
        className="inline-flex items-center gap-1 self-start"
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#8891a5",
          letterSpacing: "0.24px",
          textDecoration: "none",
        }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path
            d="M7 1L3 5.5L7 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to Project Dashboard
      </Link>

      {/* Submission header */}
      <div
        className="rounded-lg p-6"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid rgba(223,226,236,0.8)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0e1528" }}>
              Submission v{submission.currentVersion}
            </h1>
            <p style={{ fontSize: 14, color: "#8891a5", marginTop: 4 }}>
              Team: {submission.teamId} | Round: {submission.roundId}
            </p>
          </div>
          <span
            className="rounded-md px-2 py-1"
            style={{
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: submission.status === "SUBMITTED" ? "#ecfdf5" : "#eef0f6",
              color: submission.status === "SUBMITTED" ? "#047857" : "#8891a5",
            }}
          >
            {submission.status}
          </span>
        </div>
      </div>

      {/* Latest version details */}
      {submission.latestVersion && (
        <div
          className="rounded-lg p-6"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid rgba(223,226,236,0.8)",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", marginBottom: 12 }}>
            Latest Version (v{submission.latestVersion.versionNumber})
          </h2>
          <div className="flex flex-col gap-2">
            {(submission.latestVersion.sourceCodeUrl ?? submission.latestVersion.githubUrl) && (
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 12, fontWeight: 600, color: "#8891a5" }}>Source:</span>
                <a
                  href={
                    submission.latestVersion.sourceCodeUrl ??
                    submission.latestVersion.githubUrl ??
                    undefined
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 14, color: "#38bdf8" }}
                >
                  {submission.latestVersion.sourceCodeUrl ?? submission.latestVersion.githubUrl}
                </a>
              </div>
            )}
            {submission.latestVersion.slideUrl && (
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 12, fontWeight: 600, color: "#8891a5" }}>Slide:</span>
                <a
                  href={submission.latestVersion.slideUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 14, color: "#38bdf8" }}
                >
                  {submission.latestVersion.slideUrl}
                </a>
              </div>
            )}
            {submission.latestVersion.demoUrl && (
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 12, fontWeight: 600, color: "#8891a5" }}>Demo:</span>
                <a
                  href={submission.latestVersion.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 14, color: "#38bdf8" }}
                >
                  {submission.latestVersion.demoUrl}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 12, fontWeight: 600, color: "#8891a5" }}>Submitted:</span>
              <span style={{ fontSize: 14, color: "#0e1528" }}>
                {new Date(submission.latestVersion.submittedAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {submission.latestVersion.attachments.map((attachment) => {
              const href = resolveFileUrl(attachment.fileUrl);
              if (!href) return null;
              return (
                <div key={attachment.id} className="flex items-center gap-2">
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#8891a5" }}>PDF:</span>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 14, color: "#38bdf8" }}
                  >
                    {attachment.fileName} ({attachment.pageCount} pages)
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {versions && versions.length > 0 && (
        <div
          className="rounded-lg p-6"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid rgba(223,226,236,0.8)",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", marginBottom: 12 }}>
            Version History
          </h2>
          <div className="flex flex-col gap-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className="rounded-md p-3"
                style={{ backgroundColor: "#f8fafc", border: "1px solid rgba(223,226,236,0.6)" }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0e1528" }}>
                  v{version.versionNumber}
                </div>
                <div style={{ fontSize: 12, color: "#8891a5", marginTop: 4 }}>
                  {new Date(version.submittedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
