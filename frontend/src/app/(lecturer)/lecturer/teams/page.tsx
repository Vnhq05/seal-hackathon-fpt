import type { Metadata } from "next";
import { TeamMonitoringPage } from "@/features/mentor/components/team-monitoring-page";

export const metadata: Metadata = {
  title: "Teams — SEAL Hackathon Lecturer",
};

export default function LecturerTeamsRoute() {
  return <TeamMonitoringPage />;
}
