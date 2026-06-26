import { useQuery } from "@tanstack/react-query";
import { adminUserApi } from "@/lib/api";
import { LECTURER_OPTIONS_KEY } from "@/features/admin/hooks/use-admin-users";

export function useLecturerOptions() {
  return useQuery({
    queryKey: [LECTURER_OPTIONS_KEY],
    queryFn: async () => {
      const page = await adminUserApi.listUsers({
        userType: "LECTURER",
        status: "ACTIVE",
        size: 200,
      });
      return page.content;
    },
  });
}
