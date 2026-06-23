import { useMutation, useQueryClient } from "@tanstack/react-query";
import { teamApi } from "@/lib/api";

export function useRenameTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, teamId, name }: { eventId: string; teamId: string; name: string }) =>
      teamApi.updateName(eventId, teamId, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-teams-all-events"] });
    },
  });
}
