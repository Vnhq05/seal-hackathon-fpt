import type { Metadata } from "next";
import { LeaderboardPage } from "@/features/rankings/components/leaderboard-page";

export const metadata: Metadata = {
  title: "Leaderboard — SEAL Hackathon",
  description: "Track rankings and competition results.",
};

export default function LeaderboardRoute() {
  return <LeaderboardPage />;
}
