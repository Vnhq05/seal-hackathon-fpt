import { api } from "./api-client";

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
  scoreStatus: string;
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
  tracks: TrackInfo[];
  rankings: LiveScoreEntry[];
  scoresLocked: boolean;
  resultsPublished: boolean;
  leaderboardPublic: boolean;
  canManageLeaderboard: boolean;
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
  getLeaderboard(eventId: string, params?: { trackId?: string; roundId?: string }): Promise<LiveScoreBoard> {
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
