import { api } from "./api-client";

/** A judge covering a team, derived from the judge pool for the round's scope. */
export interface TeamJudgeAssignmentResponse {
  teamId: string;
  roundId: string;
  judgeUserId: string;
  judgeFullName: string | null;
}

// ═══ Types ═══

export type AssignmentScope = "ROUND" | "TRACK" | "GROUP";

export interface JudgeAssignmentResponse {
  id: string;
  roundId: string;
  scope: AssignmentScope;
  trackId: string | null;
  trackName: string | null;
  groupId: string | null;
  groupName: string | null;
  judgeUserId: string;
  judgeFullName: string | null;
  judgeEmail: string | null;
  active: boolean;
  assignedAt: string;
  deactivatedAt?: string | null;
  deactivationReason?: string | null;
  expectedTeamCount?: number;
  expectedSubmissionCount?: number;
  conflictRisk?: boolean;
  warning?: string | null;
  incompleteScopes?: IncompleteAssignmentScope[];
}

export interface IncompleteAssignmentScope {
  scope: AssignmentScope;
  trackId: string | null;
  trackName: string | null;
  groupId: string | null;
  groupName: string | null;
  judgeCount: number;
  minJudgesRequired: number;
}

export interface JudgeWorkloadPreview {
  scope: AssignmentScope;
  trackId: string | null;
  groupId: string | null;
  teamCount: number;
  submissionCount: number;
}

export interface CompetitionGroupResponse {
  id: string;
  trackId: string;
  name: string;
}

export interface GenerateCompetitionGroupsRequest {
  teamsPerGroup: number;
}

export interface GenerateCompetitionGroupsResponse {
  teamsPerGroup: number;
  totalGroupsCreated: number;
  totalTeamsAssigned: number;
  tracks: {
    trackId: string;
    trackName: string;
    teamCount: number;
    groupCount: number;
    groups: { groupId: string; name: string; teamCount: number; teamNames: string[] }[];
  }[];
}

export interface MentorAssignmentResponse {
  id: string;
  eventId: string;
  trackId: string;
  trackName: string | null;
  mentorUserId: string;
  mentorFullName: string | null;
  mentorEmail: string | null;
  assignedAt: string;
}

export interface MentorTeamAssignmentResponse {
  id: string;
  teamId: string;
  teamName: string;
  trackId: string | null;
  trackName: string | null;
  mentorUserId: string;
  mentorFullName: string | null;
  mentorEmail: string | null;
  assignedAt: string;
}

export interface MentorDrawResultResponse {
  assignments: MentorTeamAssignmentResponse[];
  assignedCount: number;
  unassignedCount: number;
  message: string;
}

export interface AssignMentorTeamBody {
  mentorUserId: string;
  teamId: string;
}

export interface AssignJudgeRequest {
  judgeUserId: string;
  scope?: AssignmentScope;
  trackId?: string;
  groupId?: string;
}

export interface AssignMentorRequest {
  mentorUserId: string;
}

export interface EventStaffResponse {
  id: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  assignedAt: string;
}

export interface AssignEventStaffRequest {
  userId: string;
}

// ═══ API calls ═══

export const assignmentApi = {
  // ── Event staff (event-level roster) ──

  listEventJudges(eventId: string): Promise<EventStaffResponse[]> {
    return api
      .get<EventJudgeApiResponse[]>(`/events/${eventId}/staff/judges`)
      .then((items) => mapStaffJudges(items));
  },

  assignEventJudge(eventId: string, body: AssignEventStaffRequest): Promise<EventStaffResponse> {
    return api
      .post<EventJudgeApiResponse>(`/events/${eventId}/staff/judges`, body)
      .then((item) => mapStaffJudge(item));
  },

  removeEventJudge(eventId: string, assignmentId: string): Promise<void> {
    return api.delete<void>(`/events/${eventId}/staff/judges/${assignmentId}`);
  },

  listEventMentors(eventId: string): Promise<EventStaffResponse[]> {
    return api
      .get<EventMentorApiResponse[]>(`/events/${eventId}/staff/mentors`)
      .then((items) => mapStaffMentors(items));
  },

  assignEventMentor(eventId: string, body: AssignEventStaffRequest): Promise<EventStaffResponse> {
    return api
      .post<EventMentorApiResponse>(`/events/${eventId}/staff/mentors`, body)
      .then((item) => mapStaffMentor(item));
  },

  removeEventMentor(eventId: string, assignmentId: string): Promise<void> {
    return api.delete<void>(`/events/${eventId}/staff/mentors/${assignmentId}`);
  },

  // ── Judges (per round + track) ──

  assignJudge(eventId: string, roundId: string, body: AssignJudgeRequest): Promise<JudgeAssignmentResponse> {
    return api.post<JudgeAssignmentResponse>(`/events/${eventId}/rounds/${roundId}/judges`, body);
  },

  listJudges(
    eventId: string,
    roundId: string,
    params?: { trackId?: string; groupId?: string },
  ): Promise<JudgeAssignmentResponse[]> {
    return api.get<JudgeAssignmentResponse[]>(`/events/${eventId}/rounds/${roundId}/judges`, {
      params,
    });
  },

  previewWorkload(
    eventId: string,
    roundId: string,
    params: { scope: AssignmentScope; trackId?: string; groupId?: string },
  ): Promise<JudgeWorkloadPreview> {
    return api.get<JudgeWorkloadPreview>(
      `/events/${eventId}/rounds/${roundId}/judges/preview-workload`,
      { params },
    );
  },

  deactivateJudge(
    eventId: string,
    roundId: string,
    assignmentId: string,
    reason: string,
  ): Promise<JudgeAssignmentResponse> {
    return api.patch<JudgeAssignmentResponse>(
      `/events/${eventId}/rounds/${roundId}/judges/${assignmentId}/deactivate`,
      { reason },
    );
  },

  activateJudge(
    eventId: string,
    roundId: string,
    assignmentId: string,
  ): Promise<JudgeAssignmentResponse> {
    return api.patch<JudgeAssignmentResponse>(
      `/events/${eventId}/rounds/${roundId}/judges/${assignmentId}/activate`,
      {},
    );
  },

  replaceJudge(
    eventId: string,
    roundId: string,
    assignmentId: string,
    body: { newJudgeUserId: string; reason: string },
  ): Promise<JudgeAssignmentResponse> {
    return api.post<JudgeAssignmentResponse>(
      `/events/${eventId}/rounds/${roundId}/judges/${assignmentId}/replace`,
      body,
    );
  },

  listCompetitionGroups(eventId: string, trackId: string): Promise<CompetitionGroupResponse[]> {
    return api.get<CompetitionGroupResponse[]>(`/events/${eventId}/tracks/${trackId}/groups`);
  },

  createCompetitionGroup(
    eventId: string,
    trackId: string,
    name: string,
  ): Promise<CompetitionGroupResponse> {
    return api.post<CompetitionGroupResponse>(`/events/${eventId}/tracks/${trackId}/groups`, { name });
  },

  deleteCompetitionGroup(eventId: string, trackId: string, groupId: string): Promise<void> {
    return api.delete<void>(`/events/${eventId}/tracks/${trackId}/groups/${groupId}`);
  },

  generateCompetitionGroups(
    eventId: string,
    body: GenerateCompetitionGroupsRequest,
  ): Promise<GenerateCompetitionGroupsResponse> {
    return api.post<GenerateCompetitionGroupsResponse>(`/events/${eventId}/groups/generate`, body);
  },

  removeJudge(eventId: string, roundId: string, assignmentId: string): Promise<void> {
    return api.delete<void>(`/events/${eventId}/rounds/${roundId}/judges/${assignmentId}`);
  },

  // ── Mentors (per track) ──

  assignMentor(eventId: string, trackId: string, body: AssignMentorRequest): Promise<MentorAssignmentResponse> {
    return api.post<MentorAssignmentResponse>(`/events/${eventId}/tracks/${trackId}/mentors`, body);
  },

  listMentors(eventId: string, trackId: string): Promise<MentorAssignmentResponse[]> {
    return api.get<MentorAssignmentResponse[]>(`/events/${eventId}/tracks/${trackId}/mentors`);
  },

  removeMentor(eventId: string, trackId: string, assignmentId: string): Promise<void> {
    return api.delete<void>(`/events/${eventId}/tracks/${trackId}/mentors/${assignmentId}`);
  },

  // ── Mentor–team (draw / list) ──

  drawMentors(eventId: string): Promise<MentorDrawResultResponse> {
    return api.post<MentorDrawResultResponse>(`/events/${eventId}/mentors/draw`);
  },

  listMentorTeams(eventId: string): Promise<MentorTeamAssignmentResponse[]> {
    return api.get<MentorTeamAssignmentResponse[]>(`/events/${eventId}/mentor-teams`);
  },

  assignMentorToTeam(eventId: string, body: AssignMentorTeamBody): Promise<MentorTeamAssignmentResponse> {
    return api.post<MentorTeamAssignmentResponse>(`/events/${eventId}/mentor-teams`, body);
  },

  removeMentorFromTeam(eventId: string, assignmentId: string): Promise<void> {
    return api.delete<void>(`/events/${eventId}/mentor-teams/${assignmentId}`);
  },

  // ── Team judge assignments (overview) ──

  getTeamAssignments(
    eventId: string,
    params: { roundId: string; season?: string; year?: number; trackId?: string },
  ): Promise<EventAssignmentsOverviewResponse> {
    return api.get<EventAssignmentsOverviewResponse>(`/events/${eventId}/assignments`, { params });
  },

};

interface EventJudgeApiResponse {
  id: string;
  judgeUserId: string;
  judgeFullName: string | null;
  judgeEmail: string | null;
  assignedAt: string;
}

interface EventMentorApiResponse {
  id: string;
  mentorUserId: string;
  mentorFullName: string | null;
  mentorEmail: string | null;
  assignedAt: string;
}

function mapStaffJudge(item: EventJudgeApiResponse): EventStaffResponse {
  return {
    id: item.id,
    userId: item.judgeUserId,
    fullName: item.judgeFullName,
    email: item.judgeEmail,
    assignedAt: item.assignedAt,
  };
}

function mapStaffMentor(item: EventMentorApiResponse): EventStaffResponse {
  return {
    id: item.id,
    userId: item.mentorUserId,
    fullName: item.mentorFullName,
    email: item.mentorEmail,
    assignedAt: item.assignedAt,
  };
}

function mapStaffJudges(items: EventJudgeApiResponse[]): EventStaffResponse[] {
  return items.map(mapStaffJudge);
}

function mapStaffMentors(items: EventMentorApiResponse[]): EventStaffResponse[] {
  return items.map(mapStaffMentor);
}

export interface EventJudgeOption {
  id: string;
  judgeUserId: string;
  judgeFullName: string | null;
  judgeEmail: string | null;
}

export interface TeamAssignmentOverview {
  teamId: string;
  teamName: string;
  trackId: string | null;
  trackName: string | null;
  groupId?: string | null;
  groupName?: string | null;
  memberCount: number;
  mentorUserId: string | null;
  mentorFullName: string | null;
  submissionStatus: string | null;
  judges: TeamJudgeAssignmentResponse[];
  judgeCount: number;
}

export interface EventAssignmentsOverviewResponse {
  eventId: string;
  roundId: string;
  eligibleJudges: EventJudgeOption[];
  teams: TeamAssignmentOverview[];
}

