import type { Metadata } from "next";
import { RoundSubmissionsPage } from "@/features/judging/components/round-submissions-page";

export const metadata: Metadata = {
  title: "Round Submissions — SEAL Hackathon",
  description: "View and score submissions for this round.",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RoundSubmissionsRoute({ params }: Props) {
  const { id } = await params;
  return <RoundSubmissionsPage roundId={id} />;
}
