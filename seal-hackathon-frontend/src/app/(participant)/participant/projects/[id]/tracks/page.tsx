import type { Metadata } from "next";
import { TrackRegistrationPage } from "@/features/events/components/track-registration-page";

export const metadata: Metadata = {
  title: "Choose Track — SEAL Hackathon",
  description: "Select a competition track for your team.",
};

interface TrackRegistrationRouteProps {
  params: Promise<{ id: string }>;
}

export default async function TrackRegistrationRoute({
  params,
}: TrackRegistrationRouteProps) {
  const { id } = await params;
  return <TrackRegistrationPage hackathonId={id} />;
}
