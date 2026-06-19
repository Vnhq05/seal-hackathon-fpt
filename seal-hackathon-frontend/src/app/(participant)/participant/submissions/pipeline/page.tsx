import type { Metadata } from "next";
import { PipelinePage } from "@/features/submissions/components/pipeline-page";

export const metadata: Metadata = {
  title: "Submission Pipeline — SEAL Hackathon",
  description:
    "Track your team's progress through the hackathon submission stages.",
};

export default function SubmissionPipelineRoute() {
  return <PipelinePage />;
}
