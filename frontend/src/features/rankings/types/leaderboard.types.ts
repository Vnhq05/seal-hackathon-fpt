export type TeamStatus = "promoted" | "active" | "at_risk" | "eliminated";

export interface LeaderboardTeam {
  id: string;
  rank: number;
  name: string;
  trackName: string;
  round1Score: number;
  round2Score: number;
  totalScore: number;
  status: TeamStatus;
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

export interface LeaderboardParams {
  track?: string;
}
