import type { Metadata } from "next";
import { TeamCompetitionsPage } from "@/features/teams/components/team-competitions-page";

export const metadata: Metadata = {
  title: "My Teams — SEAL Hackathon",
  description: "Manage your teams across hackathon events.",
};

export default function TeamsRoute() {
  return <TeamCompetitionsPage />;
}
