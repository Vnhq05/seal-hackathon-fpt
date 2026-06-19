import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMyProfile } from "@/features/profile/services/profile.service";
import { PROFILE_QUERY_KEY } from "@/features/profile/hooks/use-profile";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type { UpdateProfileRequest } from "@/features/profile/types/profile.types";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAuth = useAuthStore((state) => state.setAuth);

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (payload: UpdateProfileRequest) => updateMyProfile(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY] });
      if (user && accessToken) {
        setAuth(
          { ...user, name: data.profile.name, avatarUrl: data.profile.avatarUrl },
          accessToken,
        );
      }
    },
  });

  return { updateProfile: mutate, isPending, isSuccess, isError, error, reset };
}
