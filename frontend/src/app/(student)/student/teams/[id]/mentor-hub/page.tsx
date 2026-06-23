import { MentorHubPage } from "@/features/teams/components/mentor-hub-page";

export default async function MentorHubRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MentorHubPage eventId="" teamId={id} />;
}
