import { useQuery } from "@tanstack/react-query";
import { systemConfigApi } from "@/lib/api/system-config.api";

export const SYSTEM_TEAM_CONFIG_KEY = "system-config" as const;

export function useSystemTeamConfig() {
  return useQuery({
    queryKey: [SYSTEM_TEAM_CONFIG_KEY],
    queryFn: () => systemConfigApi.getPublic(),
    staleTime: 5 * 60 * 1000,
  });
}
