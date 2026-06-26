import type { Metadata } from "next";
import { LiveScoreListPage } from "@/features/livescore/components/livescore-list-page";

export const metadata: Metadata = {
  title: "Live Score — Coordinator",
  description: "Manage live scoreboards for hackathon events.",
};

export default function CoordinatorLivescoreRoute() {
  return <LiveScoreListPage portalBase="/coordinator" />;
}
