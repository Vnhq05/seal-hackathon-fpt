"use client";

import { useHackathonPage } from "@/features/events/hooks/use-hackathon-page";
import { HackathonHero } from "@/features/events/components/hackathon-hero";
import { HackathonAbout } from "@/features/events/components/hackathon-about";
import { HackathonTracks } from "@/features/events/components/hackathon-tracks";
import { HackathonTimeline } from "@/features/events/components/hackathon-timeline";
import { HackathonCriteriaTable } from "@/features/events/components/hackathon-criteria-table";
import { HackathonRounds } from "@/features/events/components/hackathon-rounds";
import { HackathonDetailSidebar } from "@/features/events/components/hackathon-detail-sidebar";

interface HackathonDetailPageProps {
  hackathonId: string;
}

function PageSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="animate-pulse" style={{ height: 397, backgroundColor: "rgba(223,226,236,0.8)" }} />
      <div className="p-8" style={{ maxWidth: 1280 }}>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 flex flex-col gap-8">
            <div className="animate-pulse rounded-lg" style={{ height: 200, backgroundColor: "rgba(223,226,236,0.8)" }} />
            <div className="animate-pulse rounded-lg" style={{ height: 280, backgroundColor: "rgba(223,226,236,0.8)" }} />
          </div>
          <div className="col-span-4">
            <div className="animate-pulse rounded-lg" style={{ height: 350, backgroundColor: "rgba(223,226,236,0.8)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function HackathonDetailPage({ hackathonId }: HackathonDetailPageProps) {
  const { data, isLoading } = useHackathonPage(hackathonId);

  if (isLoading) return <PageSkeleton />;

  const hackathon = data?.data;
  if (!hackathon) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p style={{ fontSize: 18, fontWeight: 600, color: "#0e1528" }}>
          Hackathon not found
        </p>
        <p style={{ fontSize: 14, color: "#8891a5", marginTop: 4 }}>
          The hackathon you are looking for does not exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <HackathonHero hackathon={hackathon} />

      <div
        className="grid grid-cols-12 gap-8"
        style={{ padding: "32px 24px" }}
      >
        <div className="col-span-8 flex flex-col gap-8">
          <HackathonAbout paragraphs={hackathon.longDescription} />
          {hackathon.tracks.length > 0 && (
            <HackathonTracks tracks={hackathon.tracks} />
          )}
          {hackathon.timeline.length > 0 && (
            <HackathonTimeline steps={hackathon.timeline} />
          )}
          {hackathon.judgingCriteria.length > 0 && (
            <HackathonCriteriaTable criteria={hackathon.judgingCriteria} />
          )}
          {hackathon.rounds.length > 0 && (
            <HackathonRounds rounds={hackathon.rounds} />
          )}
        </div>

        <div className="col-span-4">
          <div className="sticky top-8">
            <HackathonDetailSidebar hackathon={hackathon} />
          </div>
        </div>
      </div>
    </div>
  );
}
