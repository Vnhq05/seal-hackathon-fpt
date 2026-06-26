import type { Metadata } from "next";
import { HackathonListPage } from "@/features/events/components/hackathon-list-page";

export const metadata: Metadata = {
  title: "Explore Hackathons — SEAL Hackathon",
  description: "Discover and join upcoming hackathon events.",
};

export default function StudentProjectsPage() {
  return <HackathonListPage />;
}
