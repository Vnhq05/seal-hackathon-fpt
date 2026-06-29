import type { RoundType } from "@/lib/api/types";

export type { LeaderboardParams } from "@/lib/api/livescore.api";

export type LeaderboardTeamStatus = "active" | "finalist" | "eliminated";

export interface RoundScoreColumn {
  roundId: string;
  roundName: string;
  roundType: RoundType | null;
  score: number;
}

export interface LeaderboardTeam {
  id: string;
  teamId: string;
  rank: number;
  name: string;
  trackId: string | null;
  trackName: string;
  roundScores: RoundScoreColumn[];
  totalScore: number;
  status: LeaderboardTeamStatus;
  rankChange: number;
  isCurrentUserTeam: boolean;
}

export interface MyTeamSummary {
  teamId: string;
  teamName: string;
  trackName: string;
  currentRank: number;
  rankChange: number;
  totalScore: number;
}

export interface LeaderboardResponse {
  hackathonName: string;
  subtitle: string;
  tracks: string[];
  myTeam: MyTeamSummary | null;
  rankings: LeaderboardTeam[];
}

