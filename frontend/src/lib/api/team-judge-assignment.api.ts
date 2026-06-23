import { api } from "./api-client";

// ═══ Types ═══

export interface TeamJudgeAssignmentResponse {
  id: string;
  teamId: string;
  roundId: string;
  judgeUserId: string;
  judgeFullName: string;
  assignedAt: string;
}

export interface AssignJudgeToTeamRequest {
  judgeUserId: string;
}

// ═══ API calls ═══

export const teamJudgeAssignmentApi = {
  list(eventId: string, roundId: string, teamId: string): Promise<TeamJudgeAssignmentResponse[]> {
    return api.get<TeamJudgeAssignmentResponse[]>(
      `/events/${eventId}/rounds/${roundId}/teams/${teamId}/judges`
    );
  },

  assign(
    eventId: string,
    roundId: string,
    teamId: string,
    body: AssignJudgeToTeamRequest
  ): Promise<TeamJudgeAssignmentResponse> {
    return api.post<TeamJudgeAssignmentResponse>(
      `/events/${eventId}/rounds/${roundId}/teams/${teamId}/judges`,
      body
    );
  },

  remove(eventId: string, roundId: string, teamId: string, assignmentId: string): Promise<void> {
    return api.delete<void>(
      `/events/${eventId}/rounds/${roundId}/teams/${teamId}/judges/${assignmentId}`
    );
  },
};
