import type { Metadata } from "next";
import { ScoringPage } from "@/features/judging/components/scoring-page";

export const metadata: Metadata = {
  title: "Score Submission — SEAL Hackathon",
  description: "Evaluate and score a team submission.",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ScoringRoute({ params }: Props) {
  const { id } = await params;
  return <ScoringPage submissionId={id} />;
}
