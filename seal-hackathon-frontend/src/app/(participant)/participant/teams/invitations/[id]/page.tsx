import type { Metadata } from "next";
import { JoinTeamPage } from "@/features/teams/components/join-team-page";

export const metadata: Metadata = {
  title: "Team Invitation — SEAL Hackathon",
  description: "View and respond to a team invitation.",
};

interface InvitationRouteProps {
  params: Promise<{ id: string }>;
}

export default async function InvitationRoute({
  params,
}: InvitationRouteProps) {
  const { id } = await params;
  return <JoinTeamPage invitationId={id} />;
}
