import type { Metadata } from "next";
import { JudgeDashboardPage } from "@/features/judging/components/judge-dashboard-page";

export const metadata: Metadata = {
  title: "Judge Dashboard — SEAL Hackathon",
  description: "Overview of your judging assignments and scoring activity.",
};

export default function JudgeDashboardRoute() {
  return <JudgeDashboardPage />;
}
