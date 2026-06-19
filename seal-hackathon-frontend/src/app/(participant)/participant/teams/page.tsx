import type { Metadata } from "next";
import { TeamsPage } from "@/features/teams/components/teams-page";

export const metadata: Metadata = {
  title: "Teams — SEAL Hackathon",
  description: "Find teammates or manage your squad for the upcoming hackathon.",
};

export default function TeamsRoute() {
  return <TeamsPage />;
}
