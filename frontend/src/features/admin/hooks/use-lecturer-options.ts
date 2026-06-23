import { useQuery } from "@tanstack/react-query";
import { adminUserApi } from "@/lib/api";

export function useLecturerOptions() {
  return useQuery({
    queryKey: ["lecturer-options"],
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
