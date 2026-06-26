import type { Metadata } from "next";
import { EventLandingPage } from "@/features/events/components/event-landing-page";

export const metadata: Metadata = {
  title: "Hackathon Event — SEAL Hackathon",
  description: "Explore hackathon details, tracks, schedule, prizes, and register to compete.",
};

export default async function PublicEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EventLandingPage eventId={id} />;
}
