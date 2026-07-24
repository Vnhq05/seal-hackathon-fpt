"use client";

import Link from "next/link";
import { useSubmissionDetail } from "@/features/submissions/hooks/use-submission-detail";
import { useSubmissionVersions } from "@/features/submissions/hooks/use-submission-versions";
import { openSubmissionAttachment } from "@/lib/files";

interface SubmissionDetailPageProps {
  roundId: string;
  submissionId: string;
  backHref?: string;
  backLabel?: string;
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

export function SubmissionDetailPage({
  roundId,
  submissionId,
  backHref = "/student/projects",
  backLabel = "Back to Project Dashboard",
}: SubmissionDetailPageProps) {
  const { data: submission, isLoading, isError: submissionError, error: submissionErrorObj } =
    useSubmissionDetail(roundId, submissionId);
  const {
    data: versions,
    isLoading: versionsLoading,
    isError: versionsError,
    error: versionsErrorObj,
  } = useSubmissionVersions(roundId, submissionId);

  if (isLoading) return <PageSkeleton />;

  if (submissionError) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p style={{ fontSize: 18, fontWeight: 600, color: "#b91c1c" }}>
          Failed to load submission
        </p>
        <p style={{ fontSize: 14, color: "#8891a5", marginTop: 4 }}>
          {submissionErrorObj instanceof Error
            ? submissionErrorObj.message
            : "The submission could not be loaded."}
        </p>
      </div>
    );
  }

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
        href={backHref}
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
        {backLabel}
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
              Team: {submission.teamName ?? submission.teamId}
              {submission.trackName ? ` · Track: ${submission.trackName}` : ""}
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
            {(submission.latestVersion.otherUrl ?? submission.latestVersion.demoUrl) && (
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 12, fontWeight: 600, color: "#8891a5" }}>Other:</span>
                <a
                  href={submission.latestVersion.otherUrl ?? submission.latestVersion.demoUrl ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 14, color: "#38bdf8" }}
                >
                  {submission.latestVersion.otherUrl ?? submission.latestVersion.demoUrl}
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
            {submission.latestVersion.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-2">
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#8891a5" }}>PDF:</span>
                  <button
                    type="button"
                    onClick={() => void openSubmissionAttachment(attachment.fileUrl)}
                    style={{ fontSize: 14, color: "#38bdf8", textDecoration: "underline" }}
                    className="bg-transparent p-0"
                  >
                    {attachment.fileName} ({attachment.pageCount} pages)
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

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
        {versionsLoading && (
          <p style={{ fontSize: 14, color: "#8891a5" }}>Loading version history…</p>
        )}
        {versionsError && (
          <p style={{ fontSize: 14, color: "#b91c1c" }}>
            Failed to load version history
            {versionsErrorObj instanceof Error ? `: ${versionsErrorObj.message}` : "."}
          </p>
        )}
        {!versionsLoading && !versionsError && (!versions || versions.length === 0) && (
          <p style={{ fontSize: 14, color: "#8891a5" }}>No versions found.</p>
        )}
        {!versionsLoading && !versionsError && versions && versions.length > 0 && (
          <div className="flex flex-col gap-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className="rounded-md p-3"
                style={{ backgroundColor: "#f8fafc", border: "1px solid rgba(223,226,236,0.6)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0e1528" }}>
                    v{version.versionNumber}
                  </div>
                  <div style={{ fontSize: 12, color: "#8891a5" }}>
                    {new Date(version.submittedAt).toLocaleString()}
                  </div>
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  {(version.sourceCodeUrl ?? version.githubUrl) && (
                    <a
                      href={version.sourceCodeUrl ?? version.githubUrl ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, color: "#38bdf8" }}
                    >
                      Source: {version.sourceCodeUrl ?? version.githubUrl}
                    </a>
                  )}
                  {version.slideUrl && (
                    <a
                      href={version.slideUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, color: "#38bdf8" }}
                    >
                      Slide: {version.slideUrl}
                    </a>
                  )}
                  {(version.otherUrl ?? version.demoUrl) && (
                    <a
                      href={version.otherUrl ?? version.demoUrl ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, color: "#38bdf8" }}
                    >
                      Other: {version.otherUrl ?? version.demoUrl}
                    </a>
                  )}
                  {version.attachments?.map((attachment) => (
                    <button
                      key={attachment.id}
                      type="button"
                      onClick={() => void openSubmissionAttachment(attachment.fileUrl)}
                      style={{ fontSize: 12, color: "#38bdf8", textDecoration: "underline", textAlign: "left" }}
                      className="bg-transparent p-0"
                    >
                      PDF: {attachment.fileName} ({attachment.pageCount} pages)
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
