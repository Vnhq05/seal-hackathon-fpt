import { api } from "./api-client";
import type { TeamJudgeAssignmentResponse } from "./team-judge-assignment.api";

export type { TeamJudgeAssignmentResponse };

// ═══ Types ═══

export interface JudgeAssignmentResponse {
  id: string;
  roundId: string;
  trackId: string | null;
  trackName: string | null;
  judgeUserId: string;
  judgeFullName: string | null;
  judgeEmail: string | null;
  assignedAt: string;
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

export interface AssignJudgeRequest {
  judgeUserId: string;
  trackId?: string;
}

export interface AssignMentorRequest {
  mentorUserId: string;
}

// ═══ API calls ═══

export const assignmentApi = {
  // ── Judges (per round + track) ──

  assignJudge(eventId: string, roundId: string, body: AssignJudgeRequest): Promise<JudgeAssignmentResponse> {
    return api.post<JudgeAssignmentResponse>(`/events/${eventId}/rounds/${roundId}/judges`, body);
  },

  listJudges(eventId: string, roundId: string, trackId?: string): Promise<JudgeAssignmentResponse[]> {
    return api.get<JudgeAssignmentResponse[]>(`/events/${eventId}/rounds/${roundId}/judges`, {
      params: trackId ? { trackId } : undefined,
    });
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
