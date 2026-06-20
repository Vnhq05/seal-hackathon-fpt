import { useMutation } from "@tanstack/react-query";
import { userApi, type ChangePasswordRequest } from "@/lib/api/user.api";

export function useChangePassword() {
  const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
    mutationFn: (payload: ChangePasswordRequest) => userApi.changePassword(payload),
  });

  return { changePassword: mutate, isPending, isSuccess, isError, error, reset };
}
