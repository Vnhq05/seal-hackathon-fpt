import type { Metadata } from "next";
import { HackathonListPage } from "@/features/events/components/hackathon-list-page";

export const metadata: Metadata = {
  title: "Projects — SEAL Hackathon",
  description: "Discover, join, and compete in the latest hackathon events.",
};

export default function ProjectsPage() {
  return (
    <div style={{ maxWidth: 1440 }}>
      <HackathonListPage />
    </div>
  );
}
