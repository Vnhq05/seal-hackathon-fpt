"use client";

import { useState } from "react";
import { useMentorTeams } from "@/features/mentor/hooks/use-mentor-teams";
import type { MentorTeamFilter } from "@/features/mentor/types/mentor.types";
import { TeamMonitoringHeader } from "@/features/mentor/components/team-monitoring-header";
import { TeamMonitoringFilters } from "@/features/mentor/components/team-monitoring-filters";
import { TeamMonitoringTable } from "@/features/mentor/components/team-monitoring-table";

export function TeamMonitoringPage() {
  const [filter, setFilter] = useState<MentorTeamFilter>("all");

  const { data, isLoading } = useMentorTeams({
    filter: filter !== "all" ? filter : undefined,
  });

  const teams = data?.data ?? [];

  return (
    <div className="flex flex-col gap-6" style={{ padding: 32, maxWidth: 1440 }}>
      {data && (
        <TeamMonitoringHeader
          trackName={data.trackName}
          hackathonName={data.hackathonName}
          submittedCount={data.submittedCount}
          totalTeams={data.totalTeams}
          currentRound={data.currentRound}
          deadline={data.deadline}
        />
      )}

      <TeamMonitoringFilters
        activeFilter={filter}
        onFilterChange={setFilter}
      />

      <TeamMonitoringTable teams={teams} isLoading={isLoading} />
    </div>
  );
}
