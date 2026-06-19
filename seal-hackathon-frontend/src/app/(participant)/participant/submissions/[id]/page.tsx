import type { Metadata } from "next";
import { SubmissionDetailPage } from "@/features/submissions/components/submission-detail-page";

export const metadata: Metadata = {
  title: "Submission Detail — SEAL Hackathon",
  description: "View submission details, artifacts, and evaluation results.",
};

interface SubmissionDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default async function SubmissionDetailRoute({
  params,
}: SubmissionDetailRouteProps) {
  const { id } = await params;
  return (
    <div style={{ padding: 24, maxWidth: 1440 }}>
      <SubmissionDetailPage submissionId={id} />
    </div>
  );
}
