/* ------------------------------------------------------------------ */
/*  Staff Portal — shared types                                       */
/* ------------------------------------------------------------------ */

/* ---------- Pagination ---------- */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

/* ---------- Staff Dashboard ---------- */
export interface StaffDashboardSummary {
  pendingApprovals: number;
  activeTeams: number;
  totalSubmissions: number;
  activeHackathons: number;
  totalParticipants: number;
  pendingSubmissions: number;
  registeredCount: number;
  activeJudges: number;
  nextDeadlineDays: number | null;
  totalSubmissionSlots: number;
  flaggedTeams: number;
  timelinePhase: "registration" | "hacking" | "submissions" | "judging" | "closing";
}

export interface RecentApproval {
  id: string;
  name: string;
  initials: string;
  role: string;
  detail: string;
}

/* ---------- User Approval ---------- */
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  registeredDate: string;
  status: ApprovalStatus;
}

export interface ApproveRejectPayload {
  userId: string;
  action: "approve" | "reject";
  reason?: string;
}

/* ---------- Participant Management ---------- */
export type ParticipantStatus = "active" | "inactive" | "disqualified";

export interface Participant {
  id: string;
  name: string;
  email: string;
  teamName: string | null;
  hackathonName: string | null;
  status: ParticipantStatus;
  joinedDate: string;
}

export interface ParticipantListParams extends PaginationParams {
  status?: ParticipantStatus;
  hackathonId?: string;
}

/* ---------- Team Management ---------- */
export type TeamStatus = "active" | "disqualified" | "withdrawn";

export interface StaffTeam {
  id: string;
  name: string;
  trackName: string | null;
  memberCount: number;
  status: TeamStatus;
  hackathonName: string;
  hackathonId: string;
}

export interface TeamListParams extends PaginationParams {
  status?: TeamStatus;
  hackathonId?: string;
  trackId?: string;
}

/* ---------- Submission Management ---------- */
export type SubmissionStatus = "draft" | "submitted" | "reviewed" | "flagged";

export interface StaffSubmission {
  id: string;
  projectName: string;
  teamName: string;
  hackathonName: string;
  roundName: string;
  status: SubmissionStatus;
  score: number | null;
  submittedDate: string;
}

export interface SubmissionListParams extends PaginationParams {
  status?: SubmissionStatus;
  roundId?: string;
  hackathonId?: string;
}

/* ---------- Disqualification ---------- */
export interface DisqualifyPayload {
  teamId: string;
  reason: string;
  evidence?: string;
}

/* ---------- Award Management ---------- */
export type AwardStatus = "draft" | "published";

export interface Award {
  id: string;
  name: string;
  hackathonName: string;
  hackathonId: string;
  trackName: string | null;
  teamName: string | null;
  teamId: string | null;
  prize: string;
  status: AwardStatus;
}

export interface AwardPayload {
  name: string;
  hackathonId: string;
  trackId?: string;
  teamId?: string;
  prize: string;
  status: AwardStatus;
}

export interface AwardListParams extends PaginationParams {
  hackathonId?: string;
  status?: AwardStatus;
}

/* ---------- Ranking Management ---------- */
export interface RankingEntry {
  id: string;
  rank: number;
  teamId: string;
  teamName: string;
  hackathonName: string;
  score: number;
  trackName: string | null;
}

export interface RankingOverridePayload {
  rankings: { teamId: string; rank: number }[];
  hackathonId: string;
}

export interface RankingListParams extends PaginationParams {
  hackathonId?: string;
  trackId?: string;
}

/* ---------- Promotion Management ---------- */
export interface PromotionRound {
  id: string;
  name: string;
  hackathonId: string;
  hackathonName: string;
}

export interface PromotableTeam {
  teamId: string;
  teamName: string;
  score: number;
  eligible: boolean;
  currentRound: string;
}

export interface PromotePayload {
  roundId: string;
  teamIds: string[];
}

/* ---------- Announcement Management ---------- */
export type AnnouncementStatus = "draft" | "published";
export type AnnouncementAudience = "all" | "participants" | "mentors" | "judges" | "staff";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  audience: AnnouncementAudience;
  publishedDate: string | null;
  status: AnnouncementStatus;
  createdAt: string;
}

export interface AnnouncementPayload {
  title: string;
  content: string;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
}

export interface AnnouncementListParams extends PaginationParams {
  status?: AnnouncementStatus;
}

/* ---------- Audit Log ---------- */
export interface AuditLogEntry {
  id: string;
  action: string;
  performedBy: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface AuditLogParams extends PaginationParams {
  action?: string;
}
