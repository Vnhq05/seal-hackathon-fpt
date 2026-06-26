import type { Metadata } from "next";
import { HackathonDetailPage } from "@/features/events/components/hackathon-detail-page";

export const metadata: Metadata = {
  title: "Hackathon Details — SEAL Hackathon",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StudentProjectDetailPage({ params }: Props) {
  const { id } = await params;
  return <HackathonDetailPage hackathonId={id} />;
}
