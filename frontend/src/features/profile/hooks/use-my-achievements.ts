import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api/user.api";

export const MY_ACHIEVEMENTS_QUERY_KEY = "my-achievements" as const;

export function useMyAchievements() {
  return useQuery({
    queryKey: [MY_ACHIEVEMENTS_QUERY_KEY],
    queryFn: () => userApi.getMyAchievements(),
  });
}
