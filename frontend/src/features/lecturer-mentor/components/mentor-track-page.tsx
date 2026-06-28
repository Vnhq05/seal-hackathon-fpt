"use client";

import { useMentorTrack } from "@/features/lecturer-mentor/hooks/use-mentor-track";
import { MentorTrackTeamsTable } from "@/features/lecturer-mentor/components/mentor-track-teams-table";
import { MentorRoundsTimeline } from "@/features/lecturer-mentor/components/mentor-rounds-timeline";
import { MentorTrackHeader } from "@/features/lecturer-mentor/components/mentor-track-header";
import { MentorTrackStatsRow } from "@/features/lecturer-mentor/components/mentor-track-stats-row";
import { MentorInfoCard } from "@/features/lecturer-mentor/components/mentor-info-card";

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-8" style={{ padding: 32, maxWidth: 1440 }}>
      <div className="animate-pulse border-2 border-navy/10 bg-seal-surface-sunken" style={{ height: 100 }} />
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse border-2 border-navy/10 bg-seal-surface-sunken" style={{ height: 114 }} />
          ))}
        </div>
        <div className="col-span-4">
          <div className="animate-pulse border-2 border-navy/10 bg-seal-surface-sunken" style={{ height: 114 }} />
        </div>
      </div>
    </div>
  );
}

export function MentorTrackPage() {
  const { data, isLoading } = useMentorTrack();

  if (isLoading) return <PageSkeleton />;

  const track = data?.data;
  if (!track) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p style={{ fontSize: 18, fontWeight: 600, color: "#0e1528" }}>No track assigned</p>
        <p style={{ fontSize: 14, color: "#8891a5", marginTop: 4 }}>
          You have not been assigned to any track yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8" style={{ padding: 32, maxWidth: 1440, overflow: "auto" }}>
      <MentorTrackHeader
        hackathonName={track.hackathonName}
        trackName={track.name}
        description={track.description}
        trackId={track.id}
      />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <MentorTrackStatsRow
            maxTeams={track.maxTeams}
            registeredTeams={track.registeredTeams}
            currentRound={track.currentRound}
            submissionCount={track.submissionCount}
            totalTeams={track.totalTeams}
          />
        </div>
        <div className="col-span-4">
          <MentorInfoCard
            name={track.mentorName}
            avatarUrl={track.mentorAvatarUrl}
            specialty={track.mentorSpecialty}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <MentorTrackTeamsTable teams={track.teams} totalTeamCount={track.totalTeamCount} />
        </div>
        <div className="col-span-4">
          <MentorRoundsTimeline rounds={track.rounds} />
        </div>
      </div>
    </div>
  );
}
