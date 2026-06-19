import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveMentorNotes } from "@/features/mentor/services/mentor.service";
import { MENTOR_TEAM_DETAIL_KEY } from "@/features/mentor/hooks/use-mentor-team-detail";

export function useSaveMentorNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveMentorNotes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MENTOR_TEAM_DETAIL_KEY] });
    },
  });
}
