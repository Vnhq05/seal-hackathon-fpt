import type { Metadata } from "next";
import { PipelinePage } from "@/features/submissions/components/pipeline-page";

export const metadata: Metadata = {
  title: "Submission Pipeline — SEAL Hackathon",
  description:
    "Track your team's progress through the hackathon submission stages.",
};

interface Props {
  searchParams: Promise<{ roundId?: string }>;
}

export default async function SubmissionPipelineRoute({ searchParams }: Props) {
  const { roundId } = await searchParams;
  return <PipelinePage roundId={roundId ?? ""} />;
}
