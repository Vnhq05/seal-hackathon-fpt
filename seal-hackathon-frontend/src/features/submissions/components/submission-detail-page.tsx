"use client";

import Link from "next/link";
import { useSubmissionDetail } from "@/features/submissions/hooks/use-submission-detail";
import { SubmissionDetailHeader } from "@/features/submissions/components/submission-detail-header";
import { SubmissionArtifacts } from "@/features/submissions/components/submission-artifacts";
import { SubmissionVideo } from "@/features/submissions/components/submission-video";
import { SubmissionRepoInsights } from "@/features/submissions/components/submission-repo-insights";
import { SubmissionTechStack } from "@/features/submissions/components/submission-tech-stack";
import { SubmissionEvaluation } from "@/features/submissions/components/submission-evaluation";

interface SubmissionDetailPageProps {
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
          <div
            className="animate-pulse rounded-lg"
            style={{ height: 200, backgroundColor: "rgba(223,226,236,0.8)" }}
          />
        </div>
        <div className="col-span-1 flex flex-col gap-6">
          <div
            className="animate-pulse rounded-lg"
            style={{ height: 280, backgroundColor: "rgba(223,226,236,0.8)" }}
          />
          <div
            className="animate-pulse rounded-lg"
            style={{ height: 120, backgroundColor: "rgba(223,226,236,0.8)" }}
          />
        </div>
      </div>
    </div>
  );
}

export function SubmissionDetailPage({ submissionId }: SubmissionDetailPageProps) {
  const { data, isLoading } = useSubmissionDetail(submissionId);

  if (isLoading) return <PageSkeleton />;

  const submission = data?.data;
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
        href="/participant/projects"
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

      <SubmissionDetailHeader submission={submission} />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-6">
          <SubmissionArtifacts artifacts={submission.artifacts} />
          <SubmissionVideo video={submission.video} />
        </div>

        <div className="col-span-1 flex flex-col gap-6">
          {submission.repoInsights && (
            <SubmissionRepoInsights insights={submission.repoInsights} />
          )}
          <SubmissionTechStack techStack={submission.techStack} />
        </div>
      </div>

      {submission.evaluation && (
        <SubmissionEvaluation evaluation={submission.evaluation} />
      )}
    </div>
  );
}
