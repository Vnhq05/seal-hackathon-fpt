import { useMutation } from "@tanstack/react-query";
import { changeMyPassword } from "@/features/profile/services/profile.service";
import type { ChangePasswordRequest } from "@/features/profile/types/profile.types";

export function useChangePassword() {
  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (payload: ChangePasswordRequest) => changeMyPassword(payload),
  });

  return { changePassword: mutate, isPending, isSuccess, isError, error, reset };
}
