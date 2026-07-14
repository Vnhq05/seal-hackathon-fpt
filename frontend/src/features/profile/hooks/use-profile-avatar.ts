import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/lib/api/user.api";
import { PROFILE_QUERY_KEY } from "@/features/profile/hooks/use-profile";
import { useAuthStore } from "@/features/auth/store/auth.store";

function syncAuthUser(avatarUrl: string | null | undefined, fullName?: string) {
  const user = useAuthStore.getState().user;
  const accessToken = useAuthStore.getState().accessToken;
  const setAuth = useAuthStore.getState().setAuth;
  if (!user || !accessToken) return;
  setAuth(
    {
      ...user,
      fullName: fullName ?? user.fullName,
      avatarUrl: avatarUrl ?? null,
    },
    accessToken,
  );
}

export function useUploadProfileAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => userApi.uploadAvatar(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY] });
      syncAuthUser(data.avatarUrl, data.fullName);
    },
  });
}

export function useDeleteProfileAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => userApi.deleteAvatar(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY] });
      syncAuthUser(null, data.fullName);
    },
  });
}
