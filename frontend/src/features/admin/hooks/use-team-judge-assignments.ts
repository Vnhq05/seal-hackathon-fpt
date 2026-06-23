import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamJudgeAssignmentApi } from "@/lib/api";

const TEAM_JUDGES_KEY = "team-judge-assignments" as const;

export function useTeamJudgeAssignments(eventId: string, roundId: string, teamId: string) {
  return useQuery({
    queryKey: [TEAM_JUDGES_KEY, eventId, roundId, teamId],
    queryFn: () => teamJudgeAssignmentApi.list(eventId, roundId, teamId),
    enabled: !!eventId && !!roundId && !!teamId,
  });
}

export function useAssignJudgeToTeam(eventId: string, roundId: string, teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (judgeUserId: string) =>
      teamJudgeAssignmentApi.assign(eventId, roundId, teamId, { judgeUserId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TEAM_JUDGES_KEY, eventId, roundId, teamId] }),
  });
}

export function useRemoveTeamJudge(eventId: string, roundId: string, teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) =>
      teamJudgeAssignmentApi.remove(eventId, roundId, teamId, assignmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TEAM_JUDGES_KEY, eventId, roundId, teamId] }),
  });
}
