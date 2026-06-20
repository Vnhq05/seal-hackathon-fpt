import type { Metadata } from "next";
import { JudgeScoringListPage } from "@/features/judging/components/judge-scoring-list-page";

export const metadata: Metadata = {
  title: "Submissions to Score — SEAL Hackathon Judge",
  description: "View all submissions assigned to you for scoring.",
};

export default function JudgeScoringRoute() {
  return <JudgeScoringListPage />;
}
