import { api } from "./api-client";
import type { TeamJudgeAssignmentResponse } from "./team-judge-assignment.api";

export type { TeamJudgeAssignmentResponse };

// ═══ Types ═══

export interface JudgeAssignmentResponse {
  id: string;
  roundId: string;
  judgeUserId: string;
  judgeFullName: string | null;
  judgeEmail: string | null;
  assignedAt: string;
}

export interface MentorAssignmentResponse {
  id: string;
  eventId: string;
  mentorUserId: string;
  mentorFullName: string | null;
  mentorEmail: string | null;
  assignedAt: string;
}

export interface AssignJudgeRequest {
  judgeUserId: string;
}

export interface AssignMentorRequest {
  mentorUserId: string;
}

// ═══ API calls ═══

export const assignmentApi = {
  // ── Judges (per round) ──

  assignJudge(eventId: string, roundId: string, body: AssignJudgeRequest): Promise<JudgeAssignmentResponse> {
    return api.post<JudgeAssignmentResponse>(`/events/${eventId}/rounds/${roundId}/judges`, body);
  },

  listJudges(eventId: string, roundId: string): Promise<JudgeAssignmentResponse[]> {
    return api.get<JudgeAssignmentResponse[]>(`/events/${eventId}/rounds/${roundId}/judges`);
  },

  removeJudge(eventId: string, roundId: string, assignmentId: string): Promise<void> {
    return api.delete<void>(`/events/${eventId}/rounds/${roundId}/judges/${assignmentId}`);
  },

  // ── Mentors (per event) ──

  assignMentor(eventId: string, body: AssignMentorRequest): Promise<MentorAssignmentResponse> {
    return api.post<MentorAssignmentResponse>(`/events/${eventId}/mentors`, body);
  },

  listMentors(eventId: string): Promise<MentorAssignmentResponse[]> {
    return api.get<MentorAssignmentResponse[]>(`/events/${eventId}/mentors`);
  },

  removeMentor(eventId: string, assignmentId: string): Promise<void> {
    return api.delete<void>(`/events/${eventId}/mentors/${assignmentId}`);
  },

  // ── Team judge assignments (overview) ──

  getTeamAssignments(
    eventId: string,
    params: { roundId: string; season?: string; year?: number; trackId?: string },
  ): Promise<EventAssignmentsOverviewResponse> {
    return api.get<EventAssignmentsOverviewResponse>(`/events/${eventId}/assignments`, { params });
  },

  assignTeamJudges(body: CreateTeamAssignmentsRequest): Promise<TeamJudgeAssignmentResponse[]> {
    return api.post<TeamJudgeAssignmentResponse[]>("/assignments", body);
  },

  removeTeamJudgeAssignment(assignmentId: string): Promise<void> {
    return api.delete<void>(`/assignments/${assignmentId}`);
  },
};

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

export interface CreateTeamAssignmentsRequest {
  eventId: string;
  roundId: string;
  teamId: string;
  judgeUserIds: string[];
}
