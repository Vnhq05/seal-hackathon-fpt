import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { PROFILE_QUERY_KEY } from "@/features/profile/hooks/use-profile";

export function useSetupOfficialPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (newPassword: string) => userApi.setOfficialPassword({ newPassword }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY] }),
  });
}
