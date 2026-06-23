import type { Metadata } from "next";
import { MentorTeamDetailPage } from "@/features/mentor/components/mentor-team-detail-page";

export const metadata: Metadata = {
  title: "Team Detail — SEAL Hackathon Lecturer",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LecturerTeamDetailRoute({ params }: Props) {
  const { id } = await params;
  return <MentorTeamDetailPage teamId={id} />;
}
