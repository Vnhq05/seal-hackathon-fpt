import { api } from "./api-client";
import type { RoundType } from "./types";

export interface LeaderboardParams {
  trackId?: string;
  roundType?: RoundType;
  roundId?: string;
}

export type LiveScoreStatus =
  | "NOT_SUBMITTED"
  | "WAITING_FOR_SCORE"
  | "PARTIALLY_SCORED"
  | "FULLY_SCORED"
  | "LOCKED"
  | "PUBLISHED";

export interface TrackInfo {
  id: string;
  name: string;
}

export interface LiveScoreEntry {
  teamId: string;
  teamName: string;
  trackName: string | null;
  trackId: string | null;
  finalScore: number;
  rank: number;
  previousRank: number | null;
  scoreStatus: LiveScoreStatus;
  judgesScored: number;
  judgesAssigned: number;
  calculatedAt: string;
}

export interface LiveScoreBoard {
  eventId: string;
  eventName: string;
  season: string;
  year: number;
  roundId: string;
  roundName: string;
  roundType: RoundType | null;
  tracks: TrackInfo[];
  rankings: LiveScoreEntry[];
  scoresLocked: boolean;
  resultsPublished: boolean;
  leaderboardPublic: boolean;
  canManageLeaderboard: boolean;
  maxScore: number;
}

export interface RankingEvent {
  type: "LEADERBOARD_UPDATED" | "RANK_CHANGED" | "NEW_LEADER" | "FINAL_RESULTS_PUBLISHED";
  eventId: string;
  roundId: string;
  teamId: string | null;
  teamName: string | null;
  newRank: number | null;
  oldRank: number | null;
  timestamp: string;
}

export const livescoreApi = {
  getLeaderboard(eventId: string, params?: LeaderboardParams): Promise<LiveScoreBoard> {
    return api.get<LiveScoreBoard>(`/events/${eventId}/leaderboard`, { params });
  },

  lockScores(eventId: string, roundId: string): Promise<LiveScoreBoard> {
    return api.post<LiveScoreBoard>(`/events/${eventId}/leaderboard/lock`, null, { params: { roundId } });
  },

  publishResults(eventId: string, roundId: string): Promise<LiveScoreBoard> {
    return api.post<LiveScoreBoard>(`/events/${eventId}/leaderboard/publish`, null, { params: { roundId } });
  },

  setLeaderboardPublic(eventId: string, enabled: boolean): Promise<LiveScoreBoard> {
    return api.post<LiveScoreBoard>(`/events/${eventId}/leaderboard/public`, null, { params: { enabled } });
  },
};
