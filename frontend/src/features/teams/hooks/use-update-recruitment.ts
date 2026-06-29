import { useMutation, useQueryClient } from "@tanstack/react-query";
import { teamApi, type UpdateTeamRecruitmentRequest } from "@/lib/api/team.api";
import { JOINABLE_TEAMS_KEY } from "@/features/teams/hooks/use-joinable-teams";
import { MY_TEAM_KEY } from "@/features/teams/hooks/use-my-teams";

export function useUpdateRecruitment(eventId: string, teamId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateTeamRecruitmentRequest) =>
      teamApi.updateRecruitment(eventId, teamId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-teams-all-events"] });
      qc.invalidateQueries({ queryKey: [JOINABLE_TEAMS_KEY, eventId] });
      qc.invalidateQueries({ queryKey: [MY_TEAM_KEY, eventId] });
    },
  });
}
