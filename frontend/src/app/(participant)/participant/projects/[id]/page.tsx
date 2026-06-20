import type { Metadata } from "next";
import { HackathonDetailPage } from "@/features/events/components/hackathon-detail-page";

export const metadata: Metadata = {
  title: "Hackathon Detail — SEAL Hackathon",
  description: "View hackathon details, tracks, timeline, and judging criteria.",
};

interface HackathonDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default async function HackathonDetailRoute({
  params,
}: HackathonDetailRouteProps) {
  const { id } = await params;
  return <HackathonDetailPage hackathonId={id} />;
}
