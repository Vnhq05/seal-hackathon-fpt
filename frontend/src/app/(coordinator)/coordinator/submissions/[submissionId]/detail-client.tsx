"use client";

import { useParams, useSearchParams } from "next/navigation";
import { SubmissionDetailPage } from "@/features/submissions/components/submission-detail-page";

export function CoordinatorSubmissionDetailClient() {
  const params = useParams<{ submissionId: string }>();
  const searchParams = useSearchParams();
  const roundId = searchParams.get("roundId") ?? "";
  const eventId = searchParams.get("eventId");
  const trackId = searchParams.get("trackId");

  const backParams = new URLSearchParams();
  if (eventId) backParams.set("eventId", eventId);
  if (roundId) backParams.set("roundId", roundId);
  if (trackId) backParams.set("trackId", trackId);
  const backQuery = backParams.toString();

  if (!roundId || !params.submissionId) {
    return (
      <div className="p-6 text-sm text-seal-text-muted">
        Missing round or submission. Go back to Submissions and open a team again.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <SubmissionDetailPage
        roundId={roundId}
        submissionId={params.submissionId}
        backHref={backQuery ? `/coordinator/submissions?${backQuery}` : "/coordinator/submissions"}
        backLabel="Back to Submissions"
      />
    </div>
  );
}
