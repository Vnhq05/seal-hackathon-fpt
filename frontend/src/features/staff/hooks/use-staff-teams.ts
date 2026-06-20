import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TeamListParams, StaffTeam, PaginatedResponse, DisqualifyPayload } from "@/features/staff/types/staff.types";

export const STAFF_TEAMS_KEY = "staff-teams" as const;

// TODO: backend endpoint not implemented yet — /staff/teams does not exist.
// teamApi.list(eventId) requires an eventId. Staff view lists teams across all events,
// which has no backend equivalent. Returning placeholder data.
export function useStaffTeams(params?: TeamListParams) {
  return useQuery<PaginatedResponse<StaffTeam>>({
    queryKey: [STAFF_TEAMS_KEY, params],
    queryFn: async (): Promise<PaginatedResponse<StaffTeam>> => {
      return {
        data: [],
        total: 0,
        page: 1,
        pageSize: params?.pageSize ?? 10,
        totalPages: 0,
      } as unknown as PaginatedResponse<StaffTeam>;
    },
  });
}

// TODO: backend endpoint not implemented yet — /staff/teams/:id/disqualify does not exist.
export function useDisqualifyTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_payload: DisqualifyPayload): Promise<void> => {
      console.warn("Disqualify team: backend endpoint not implemented yet");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_TEAMS_KEY] });
    },
  });
}
