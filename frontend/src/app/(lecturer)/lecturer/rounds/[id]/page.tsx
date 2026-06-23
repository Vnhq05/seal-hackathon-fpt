import type { Metadata } from "next";
import { RoundSubmissionsPage } from "@/features/judging/components/round-submissions-page";

export const metadata: Metadata = {
  title: "Round Submissions — SEAL Hackathon Lecturer",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LecturerRoundSubmissionsRoute({ params }: Props) {
  const { id } = await params;
  return <RoundSubmissionsPage roundId={id} />;
}
