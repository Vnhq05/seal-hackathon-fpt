import type { Metadata } from "next";
import { LiveScoreArenaPage } from "@/features/livescore/components/livescore-arena-page";

export const metadata: Metadata = {
  title: "LiveScore Arena — SEAL Hackathon",
  description: "Real-time hackathon ranking and results.",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LiveScoreRoute({ params }: Props) {
  const { id } = await params;
  return <LiveScoreArenaPage eventId={id} />;
}
