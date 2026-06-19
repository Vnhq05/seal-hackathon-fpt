import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadMyAvatar } from "@/features/profile/services/profile.service";
import { PROFILE_QUERY_KEY } from "@/features/profile/hooks/use-profile";
import { useAuthStore } from "@/features/auth/store/auth.store";

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAuth = useAuthStore((state) => state.setAuth);

  const { mutate, isPending } = useMutation({
    mutationFn: uploadMyAvatar,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY] });
      if (user && accessToken) {
        setAuth({ ...user, avatarUrl: data.avatarUrl }, accessToken);
      }
    },
  });

  return { uploadAvatar: mutate, isPending };
}
