import type { Metadata } from "next";
import { MentorTeamDetailPage } from "@/features/mentor/components/mentor-team-detail-page";

export const metadata: Metadata = {
  title: "Team Detail — SEAL Hackathon",
  description: "Review team submissions and provide mentoring notes.",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MentorTeamDetailRoute({ params }: Props) {
  const { id } = await params;
  return <MentorTeamDetailPage teamId={id} />;
}
