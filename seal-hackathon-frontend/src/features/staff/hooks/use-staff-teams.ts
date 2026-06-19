import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchStaffTeams, disqualifyTeam } from "@/features/staff/services/staff.service";
import type { TeamListParams } from "@/features/staff/types/staff.types";

export const STAFF_TEAMS_KEY = "staff-teams" as const;

export function useStaffTeams(params?: TeamListParams) {
  return useQuery({
    queryKey: [STAFF_TEAMS_KEY, params],
    queryFn: () => fetchStaffTeams(params),
  });
}

export function useDisqualifyTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disqualifyTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_TEAMS_KEY] });
    },
  });
}
