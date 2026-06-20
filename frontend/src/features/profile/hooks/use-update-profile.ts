import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, type UpdateProfileRequest } from "@/lib/api/user.api";
import { PROFILE_QUERY_KEY } from "@/features/profile/hooks/use-profile";
import { useAuthStore } from "@/features/auth/store/auth.store";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAuth = useAuthStore((state) => state.setAuth);

  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (payload: UpdateProfileRequest) => userApi.updateMyProfile(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY] });
      if (user && accessToken) {
        setAuth(
          { ...user, fullName: data.fullName },
          accessToken,
        );
      }
    },
  });

  return { updateProfile: mutate, isPending, isSuccess, isError, error, reset };
}
