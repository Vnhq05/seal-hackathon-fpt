import { LiveScoreArenaPage } from "@/features/livescore/components/livescore-arena-page";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function LiveScorePage({ params }: PageProps) {
  const { eventId } = await params;
  return <LiveScoreArenaPage eventId={eventId} />;
}
