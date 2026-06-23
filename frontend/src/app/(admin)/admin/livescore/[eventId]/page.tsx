import type { Metadata } from "next";
import { LiveScoreArenaPage } from "@/features/livescore/components/livescore-arena-page";

export const metadata: Metadata = {
  title: "LiveScore Arena — Admin",
  description: "Admin view of real-time hackathon ranking.",
};

interface Props {
  params: Promise<{ eventId: string }>;
}

export default async function AdminLiveScoreRoute({ params }: Props) {
  const { eventId } = await params;
  return <LiveScoreArenaPage eventId={eventId} />;
}
