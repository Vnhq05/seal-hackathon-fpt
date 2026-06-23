import type { Metadata } from "next";
import { LiveScoreListPage } from "@/features/livescore/components/livescore-list-page";

export const metadata: Metadata = {
  title: "LiveScore Arena — Admin",
  description: "Select an event for real-time rankings.",
};

export default function AdminLiveScoreListRoute() {
  return <LiveScoreListPage />;
}
