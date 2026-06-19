import type { Metadata } from "next";
import { TeamRankingPage } from "@/features/teams/components/team-ranking-page";

export const metadata: Metadata = {
  title: "Team Rankings — SEAL Hackathon",
  description: "View team rankings and leaderboard for the hackathon.",
};

export default function TeamRankingsRoute() {
  return <TeamRankingPage />;
}
