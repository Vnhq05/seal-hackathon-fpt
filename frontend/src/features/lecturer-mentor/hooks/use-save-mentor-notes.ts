import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SaveMentorNotesRequest, SaveMentorNotesResponse } from "@/features/lecturer-mentor/types/mentor.types";
import { MENTOR_TEAM_DETAIL_KEY } from "@/features/lecturer-mentor/hooks/use-mentor-team-detail";

export function useSaveMentorNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SaveMentorNotesRequest): Promise<SaveMentorNotesResponse> => {
      void payload;
      return { message: "Notes saved" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MENTOR_TEAM_DETAIL_KEY] });
    },
  });
}
