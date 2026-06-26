import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SaveMentorNotesRequest, SaveMentorNotesResponse } from "@/features/lecturer-mentor/types/mentor.types";
import { MENTOR_TEAM_DETAIL_KEY } from "@/features/lecturer-mentor/hooks/use-mentor-team-detail";

// TODO: backend endpoint not implemented yet — /mentor/submissions/:id/notes does not exist.
// No equivalent endpoint exists in the current backend.
export function useSaveMentorNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SaveMentorNotesRequest): Promise<SaveMentorNotesResponse> => {
      // Placeholder — no backend endpoint for mentor notes
      return { message: "Notes saved (placeholder)" } as unknown as SaveMentorNotesResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MENTOR_TEAM_DETAIL_KEY] });
    },
  });
}
