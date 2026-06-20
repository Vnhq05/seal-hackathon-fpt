import type { Metadata } from "next";
import { LeaderboardPage } from "@/features/rankings/components/leaderboard-page";

export const metadata: Metadata = {
  title: "Leaderboard — SEAL Hackathon",
  description: "Track rankings and competition results.",
};

interface Props {
  searchParams: Promise<{ roundId?: string }>;
}

export default async function LeaderboardRoute({ searchParams }: Props) {
  const { roundId } = await searchParams;
  return <LeaderboardPage roundId={roundId ?? ""} />;
}
