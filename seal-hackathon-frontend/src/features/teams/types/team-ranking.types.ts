export interface RankedTeamMember {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface RankedTeam {
  id: string;
  rank: number;
  name: string;
  trackName: string;
  score: number;
  members: RankedTeamMember[];
  isCurrentUserTeam: boolean;
}

export interface TeamRankingsResponse {
  hackathonId: string;
  hackathonName: string;
  lastUpdatedAt: string;
  rankings: RankedTeam[];
}
