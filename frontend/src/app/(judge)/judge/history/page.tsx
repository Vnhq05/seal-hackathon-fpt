import type { Metadata } from "next";
import { ScoreHistoryPage } from "@/features/judging/components/score-history-page";

export const metadata: Metadata = {
  title: "Score History — SEAL Hackathon",
  description: "Review your past scoring activities.",
};

export default function ScoreHistoryRoute() {
  return <ScoreHistoryPage />;
}
