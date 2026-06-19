import { apiClient } from "@/lib/axios";
import type {
  StaffDashboardSummary,
  RecentApproval,
  PendingUser,
  ApproveRejectPayload,
  Participant,
  ParticipantListParams,
  StaffTeam,
  TeamListParams,
  StaffSubmission,
  SubmissionListParams,
  DisqualifyPayload,
  Award,
  AwardPayload,
  AwardListParams,
  RankingEntry,
  RankingOverridePayload,
  RankingListParams,
  PromotionRound,
  PromotableTeam,
  PromotePayload,
  Announcement,
  AnnouncementPayload,
  AnnouncementListParams,
  AuditLogEntry,
  AuditLogParams,
  PaginatedResponse,
} from "@/features/staff/types/staff.types";

/* ---------- Dashboard ---------- */
export async function fetchStaffDashboard(): Promise<StaffDashboardSummary> {
  const { data } = await apiClient.get<StaffDashboardSummary>("/staff/dashboard");
  return data;
}

export async function fetchRecentApprovals(): Promise<RecentApproval[]> {
  const { data } = await apiClient.get<RecentApproval[]>("/staff/dashboard/recent-approvals");
  return data;
}

/* ---------- User Approval ---------- */
export async function fetchPendingUsers(params?: { page?: number; pageSize?: number; search?: string }): Promise<PaginatedResponse<PendingUser>> {
  const { data } = await apiClient.get<PaginatedResponse<PendingUser>>("/staff/users/pending", { params });
  return data;
}

export async function approveRejectUser(payload: ApproveRejectPayload): Promise<void> {
  await apiClient.post(`/staff/users/${payload.userId}/${payload.action}`, { reason: payload.reason });
}

/* ---------- Participants ---------- */
export async function fetchParticipants(params?: ParticipantListParams): Promise<PaginatedResponse<Participant>> {
  const { data } = await apiClient.get<PaginatedResponse<Participant>>("/staff/participants", { params });
  return data;
}

export async function deactivateParticipant(participantId: string): Promise<void> {
  await apiClient.patch(`/staff/participants/${participantId}/deactivate`);
}

/* ---------- Teams ---------- */
export async function fetchStaffTeams(params?: TeamListParams): Promise<PaginatedResponse<StaffTeam>> {
  const { data } = await apiClient.get<PaginatedResponse<StaffTeam>>("/staff/teams", { params });
  return data;
}

export async function disqualifyTeam(payload: DisqualifyPayload): Promise<void> {
  await apiClient.post(`/staff/teams/${payload.teamId}/disqualify`, {
    reason: payload.reason,
    evidence: payload.evidence,
  });
}

/* ---------- Submissions ---------- */
export async function fetchStaffSubmissions(params?: SubmissionListParams): Promise<PaginatedResponse<StaffSubmission>> {
  const { data } = await apiClient.get<PaginatedResponse<StaffSubmission>>("/staff/submissions", { params });
  return data;
}

export async function flagSubmission(submissionId: string): Promise<void> {
  await apiClient.patch(`/staff/submissions/${submissionId}/flag`);
}

/* ---------- Awards ---------- */
export async function fetchAwards(params?: AwardListParams): Promise<PaginatedResponse<Award>> {
  const { data } = await apiClient.get<PaginatedResponse<Award>>("/staff/awards", { params });
  return data;
}

export async function createAward(payload: AwardPayload): Promise<Award> {
  const { data } = await apiClient.post<Award>("/staff/awards", payload);
  return data;
}

export async function updateAward(id: string, payload: AwardPayload): Promise<Award> {
  const { data } = await apiClient.put<Award>(`/staff/awards/${id}`, payload);
  return data;
}

export async function deleteAward(id: string): Promise<void> {
  await apiClient.delete(`/staff/awards/${id}`);
}

/* ---------- Rankings ---------- */
export async function fetchRankings(params?: RankingListParams): Promise<PaginatedResponse<RankingEntry>> {
  const { data } = await apiClient.get<PaginatedResponse<RankingEntry>>("/staff/rankings", { params });
  return data;
}

export async function overrideRankings(payload: RankingOverridePayload): Promise<void> {
  await apiClient.put("/staff/rankings/override", payload);
}

/* ---------- Promotions ---------- */
export async function fetchPromotionRounds(): Promise<PromotionRound[]> {
  const { data } = await apiClient.get<PromotionRound[]>("/staff/promotions/rounds");
  return data;
}

export async function fetchPromotableTeams(roundId: string): Promise<PromotableTeam[]> {
  const { data } = await apiClient.get<PromotableTeam[]>(`/staff/promotions/rounds/${roundId}/teams`);
  return data;
}

export async function promoteTeams(payload: PromotePayload): Promise<void> {
  await apiClient.post("/staff/promotions/promote", payload);
}

/* ---------- Announcements ---------- */
export async function fetchAnnouncements(params?: AnnouncementListParams): Promise<PaginatedResponse<Announcement>> {
  const { data } = await apiClient.get<PaginatedResponse<Announcement>>("/staff/announcements", { params });
  return data;
}

export async function createAnnouncement(payload: AnnouncementPayload): Promise<Announcement> {
  const { data } = await apiClient.post<Announcement>("/staff/announcements", payload);
  return data;
}

export async function updateAnnouncement(id: string, payload: AnnouncementPayload): Promise<Announcement> {
  const { data } = await apiClient.put<Announcement>(`/staff/announcements/${id}`, payload);
  return data;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await apiClient.delete(`/staff/announcements/${id}`);
}

/* ---------- Audit Log ---------- */
export async function fetchAuditLog(params?: AuditLogParams): Promise<PaginatedResponse<AuditLogEntry>> {
  const { data } = await apiClient.get<PaginatedResponse<AuditLogEntry>>("/staff/audit-log", { params });
  return data;
}
