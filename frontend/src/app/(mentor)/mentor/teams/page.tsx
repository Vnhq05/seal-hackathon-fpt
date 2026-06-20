import type { Metadata } from "next";
import { TeamMonitoringPage } from "@/features/mentor/components/team-monitoring-page";

export const metadata: Metadata = {
  title: "Team Monitoring — SEAL Hackathon",
  description: "Monitor teams in your assigned track.",
};

export default function MentorTeamsRoute() {
  return <TeamMonitoringPage />;
}
