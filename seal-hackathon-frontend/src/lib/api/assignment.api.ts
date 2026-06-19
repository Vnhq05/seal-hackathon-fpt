import { api } from "./api-client";

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
};
