import type { Metadata } from "next";
import { LiveScoreArenaPage } from "@/features/livescore/components/livescore-arena-page";

export const metadata: Metadata = {
  title: "Live Score Arena — Coordinator",
};

export default async function CoordinatorLivescoreEventRoute({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <LiveScoreArenaPage eventId={eventId} />;
}
