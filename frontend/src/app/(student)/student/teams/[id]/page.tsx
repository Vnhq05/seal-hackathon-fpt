import type { Metadata } from "next";
import { TeamDetailPage } from "@/features/teams/components/team-detail-page";

export const metadata: Metadata = {
  title: "Team — SEAL Hackathon",
  description: "Manage your team and invite members.",
};

interface TeamDetailRouteProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ eventId?: string }>;
}

export default async function TeamDetailRoute({
  params,
  searchParams,
}: TeamDetailRouteProps) {
  const { id } = await params;
  const { eventId } = await searchParams;
  return <TeamDetailPage eventId={eventId ?? ""} teamId={id} />;
}
