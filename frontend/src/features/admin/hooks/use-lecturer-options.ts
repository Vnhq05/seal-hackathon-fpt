import { useQuery } from "@tanstack/react-query";
import { adminUserApi, coordinatorUserApi } from "@/lib/api";
import { LECTURER_OPTIONS_KEY } from "@/features/admin/hooks/use-admin-users";
import { useAuthStore } from "@/features/auth/store/auth.store";

export function useLecturerOptions() {
  const userType = useAuthStore((s) => s.user?.userType);

  return useQuery({
    queryKey: [LECTURER_OPTIONS_KEY, userType],
    queryFn: async () => {
      if (userType === "EVENT_COORDINATOR") {
        const page = await coordinatorUserApi.listLecturers({ size: 200 });
        return page.content;
      }
      const page = await adminUserApi.listUsers({
        userType: "LECTURER",
        status: "ACTIVE",
        size: 200,
      });
      return page.content;
    },
  });
}
