import type { Metadata } from "next";
import { JudgeScoringListPage } from "@/features/judging/components/judge-scoring-list-page";

export const metadata: Metadata = {
  title: "Submissions to Score — SEAL Hackathon Lecturer",
};

export default function LecturerScoringRoute() {
  return <JudgeScoringListPage />;
}
