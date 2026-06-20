import type { Metadata } from "next";
import { MentorDashboardPage } from "@/features/mentor/components/mentor-dashboard-page";

export const metadata: Metadata = {
  title: "Mentor Dashboard — SEAL Hackathon",
  description: "Overview of your assigned tracks and teams.",
};

export default function MentorDashboardRoute() {
  return <MentorDashboardPage />;
}
