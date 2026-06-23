import type { Metadata } from "next";
import { ScoreHistoryPage } from "@/features/judging/components/score-history-page";

export const metadata: Metadata = {
  title: "Score History — SEAL Hackathon Lecturer",
};

export default function LecturerHistoryRoute() {
  return <ScoreHistoryPage />;
}
