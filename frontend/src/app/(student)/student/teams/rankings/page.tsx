import type { Metadata } from "next";
import { TeamRankingPage } from "@/features/teams/components/team-ranking-page";

export const metadata: Metadata = {
  title: "Team Rankings — SEAL Hackathon",
  description: "View team rankings and leaderboard for the hackathon.",
};

interface Props {
  searchParams: Promise<{ roundId?: string }>;
}

export default async function TeamRankingsRoute({ searchParams }: Props) {
  const { roundId } = await searchParams;
  return <TeamRankingPage roundId={roundId ?? ""} />;
}
