import type { Metadata } from "next";
import { TeamDetailPage } from "@/features/teams/components/team-detail-page";

export const metadata: Metadata = {
  title: "Team — SEAL Hackathon",
  description: "Manage your team and invite members.",
};

interface TeamDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default async function TeamDetailRoute({
  params,
}: TeamDetailRouteProps) {
  const { id } = await params;
  return <TeamDetailPage teamId={id} />;
}
