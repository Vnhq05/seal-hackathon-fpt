import type { Metadata } from "next";
import { RankingPage } from "@/features/rankings/components/ranking-page";

export const metadata: Metadata = {
  title: "Rankings — SEAL Hackathon",
  description: "View team rankings across hackathon events.",
};

export default function Page() {
  return <RankingPage />;
}
