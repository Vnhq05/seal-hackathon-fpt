/* ── Admin core types ── */

export interface AdminDashboardStats {
  totalHackathons: number;
  activeUsers: number;
  pendingApprovals: number;
  totalSubmissions: number;
  activityTrend: { date: string; count: number }[];
  activeEvents: number;
  totalTeams: number;
  totalEventsTrend: number;
  activeUsersTrend: number;
  totalTeamsTrend: number;
  totalSubmissionsTrend: number;
  systemOperational: boolean;
}

export interface AdminActiveEvent {
  id: string;
  name: string;
  status: "Active" | "Upcoming" | "Ended";
  participants: number;
  round: string;
  staffAvatars: string[];
}

export interface AdminActivityEntry {
  id: string;
  color: "blue" | "green" | "orange" | "gray";
  title: string;
  detail: string;
  time: string;
}

/* ── Hackathon CRUD ── */

export type HackathonStatus = "DRAFT" | "ACTIVE" | "ENDED";

export interface AdminHackathon {
  id: string;
  name: string;
  status: HackathonStatus;
  startDate: string;
  endDate: string;
  teamsCount: number;
  description: string;
  format: string;
  minTeamSize: number;
  maxTeamSize: number;
  prizePool: string;
  registrationDeadline: string;
  bannerUrl: string | null;
}

export interface AdminHackathonListResponse {
  data: AdminHackathon[];
  total: number;
}

export interface CreateHackathonRequest {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  format: string;
  minTeamSize: number;
  maxTeamSize: number;
  prizePool: string;
  registrationDeadline: string;
  banner?: File;
}

export interface UpdateHackathonRequest extends Partial<CreateHackathonRequest> {
  id: string;
}

/* ── Rounds ── */

export type RoundStatus = "UPCOMING" | "ACTIVE" | "COMPLETED";
export type RoundType = "ASYNC" | "LIVE";

export interface AdminRound {
  id: string;
  hackathonId: string;
  hackathonName: string;
  roundNumber: number;
  name: string;
  type: RoundType;
  startDate: string;
  endDate: string;
  status: RoundStatus;
  submissionsCount: number;
  submissionDeadline: string;
  description: string;
}

export interface AdminRoundListResponse {
  data: AdminRound[];
  total: number;
}

export interface CreateRoundRequest {
  hackathonId: string;
  name: string;
  description: string;
  type: RoundType;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
}

export interface UpdateRoundRequest extends Partial<CreateRoundRequest> {
  id: string;
}

/* ── Tracks ── */

export type TrackStatus = "OPEN" | "CLOSED";

export interface AdminTrack {
  id: string;
  name: string;
  hackathonId: string;
  hackathonName: string;
  teamsCount: number;
  mentorName: string | null;
  mentorId: string | null;
  status: TrackStatus;
  description: string;
  maxTeams: number;
}

export interface AdminTrackListResponse {
  data: AdminTrack[];
  total: number;
}

export interface CreateTrackRequest {
  hackathonId: string;
  name: string;
  description: string;
  maxTeams: number;
  mentorId?: string;
}

export interface UpdateTrackRequest extends Partial<CreateTrackRequest> {
  id: string;
}

/* ── System Config ── */

export interface SystemConfig {
  platformName: string;
  registrationOpen: boolean;
  maxTeamSize: number;
  emailTemplateWelcome: string;
  emailTemplateSubmission: string;
  featureFlagLeaderboard: boolean;
  featureFlagMentorPortal: boolean;
  featureFlagJudgePortal: boolean;
}

/* ── User Management ── */

export type UserRole = "ADMIN" | "JUDGE" | "MENTOR" | "PARTICIPANT" | "STAFF";
export type UserStatus = "ACTIVE" | "SUSPENDED";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedDate: string;
  avatarUrl: string | null;
}

export interface AdminUserListResponse {
  data: AdminUser[];
  total: number;
}

export interface AdminUserListParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
}

export interface UpdateUserRequest {
  id: string;
  role?: UserRole;
  status?: UserStatus;
}

/* ── Mentor dropdown ── */

export interface MentorOption {
  id: string;
  name: string;
  email: string;
}
