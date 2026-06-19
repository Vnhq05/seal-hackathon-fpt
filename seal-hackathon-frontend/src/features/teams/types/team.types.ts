export interface TeamMember {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  hackathonId: string;
  hackathonName: string;
  memberCount: number;
  maxMembers: number;
  trackName: string | null;
  status: "open" | "full";
  members: TeamMember[];
}

export interface TeamDetailMember {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  isLeader: boolean;
}

export interface TeamRanking {
  trackRank: number;
  overallRank: number;
  trackName: string;
}

export interface SubmissionRound {
  id: string;
  roundNumber: number;
  name: string;
  status: "submitted" | "pending" | "not_open";
  dueDate: string | null;
  daysUntilDue: number | null;
}

export interface TrackDetail {
  name: string;
  fullName: string;
  mentorName: string | null;
}

export interface TeamDetail {
  id: string;
  name: string;
  description: string;
  hackathonId: string;
  hackathonName: string;
  memberCount: number;
  maxMembers: number;
  status: "active" | "inactive";
  members: TeamDetailMember[];
  leader: TeamDetailMember | null;
  track: TrackDetail;
  ranking: TeamRanking;
  rounds: SubmissionRound[];
}

export interface TeamDetailResponse {
  data: TeamDetail;
}

export interface TeamsListParams {
  search?: string;
  track?: string;
  openOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface TeamsListResponse {
  data: Team[];
  total: number;
  page: number;
  totalPages: number;
}

export interface MyTeamResponse {
  data: Team | null;
}

export interface TracksResponse {
  data: string[];
}
