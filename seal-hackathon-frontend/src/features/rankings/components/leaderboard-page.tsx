"use client";

import { useEffect, useMemo } from "react";
import { useLeaderboard } from "@/features/rankings/hooks/use-leaderboard";
import { useDownloadRanking } from "@/features/rankings/hooks/use-download-ranking";
import { useLeaderboardStore } from "@/features/rankings/store/leaderboard.store";
import { LeaderboardHeader } from "@/features/rankings/components/leaderboard-header";
import { LeaderboardTabs } from "@/features/rankings/components/leaderboard-tabs";
import { LeaderboardTeamCard } from "@/features/rankings/components/leaderboard-team-card";
import { LeaderboardTable } from "@/features/rankings/components/leaderboard-table";

const TAB_ALL = "all-tracks";
const TAB_MY_TEAM = "my-team-stats";

export function LeaderboardPage() {
  const { activeTab, setActiveTab } = useLeaderboardStore();

  const trackParam = useMemo(() => {
    if (activeTab === TAB_ALL || activeTab === TAB_MY_TEAM || !activeTab) {
      return undefined;
    }
    return activeTab;
  }, [activeTab]);

  const { data, isLoading, isError } = useLeaderboard(
    trackParam ? { track: trackParam } : undefined,
  );

  const downloadMutation = useDownloadRanking();

  useEffect(() => {
    if (data && !activeTab && data.tracks.length > 0) {
      setActiveTab(data.tracks[0]);
    }
  }, [data, activeTab, setActiveTab]);

  const tabs = useMemo(() => {
    const trackTabs = (data?.tracks ?? []).map((track) => ({
      id: track,
      label: `${track} Rankings`,
    }));
    return [
      ...trackTabs,
      { id: TAB_ALL, label: "All Tracks" },
      { id: TAB_MY_TEAM, label: "My Team Stats" },
    ];
  }, [data?.tracks]);

  const filteredRankings = useMemo(() => {
    if (!data) return [];
    if (activeTab === TAB_MY_TEAM) {
      return data.rankings.filter((t) => t.isCurrentUserTeam);
    }
    return data.rankings;
  }, [data, activeTab]);

  const handleDownload = () => {
    downloadMutation.mutate(trackParam);
  };

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4" style={{ padding: 64 }}>
        <p style={{ fontSize: 18, fontWeight: 600, color: "#0e1528" }}>
          Unable to load rankings
        </p>
        <p style={{ fontSize: 14, color: "#8891a5" }}>
          Could not load leaderboard data. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8" style={{ maxWidth: 1440, padding: 24 }}>
      <LeaderboardHeader
        hackathonName={data?.hackathonName ?? ""}
        subtitle={data?.subtitle ?? ""}
        onDownloadCsv={handleDownload}
        isDownloading={downloadMutation.isPending}
      />

      <LeaderboardTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {data?.myTeam && activeTab !== TAB_MY_TEAM && (
        <LeaderboardTeamCard myTeam={data.myTeam} />
      )}

      <LeaderboardTable rankings={filteredRankings} isLoading={isLoading} />
    </div>
  );
}
