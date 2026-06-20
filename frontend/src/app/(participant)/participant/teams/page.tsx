import type { Metadata } from "next";
import { TeamsPage } from "@/features/teams/components/teams-page";

export const metadata: Metadata = {
  title: "Teams — SEAL Hackathon",
  description: "Find teammates or manage your squad for the upcoming hackathon.",
};

interface Props {
  searchParams: Promise<{ eventId?: string }>;
}

export default async function TeamsRoute({ searchParams }: Props) {
  const { eventId } = await searchParams;
  return <TeamsPage eventId={eventId ?? ""} />;
}
