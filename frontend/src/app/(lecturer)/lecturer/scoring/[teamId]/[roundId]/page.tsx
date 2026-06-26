import type { Metadata } from "next";
import { ScoringPage } from "@/features/judging/components/scoring-page";

export const metadata: Metadata = {
  title: "Score Submission — SEAL Hackathon Lecturer",
};

interface Props {
  params: Promise<{ teamId: string; roundId: string }>;
}

export default async function LecturerScoringDetailRoute({ params }: Props) {
  const { teamId, roundId } = await params;
  return <ScoringPage teamId={teamId} roundId={roundId} />;
}
