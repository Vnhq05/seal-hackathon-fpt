import { useQuery } from "@tanstack/react-query";
import { eventApi, notificationApi } from "@/lib/api";

export const DASHBOARD_SUMMARY_KEY = "dashboard-summary" as const;

export function useDashboardSummary() {
  return useQuery({
    queryKey: [DASHBOARD_SUMMARY_KEY],
    queryFn: async () => {
      const [events, unread] = await Promise.all([
        eventApi.list({ status: "ACTIVE" }),
        notificationApi.countUnread(),
      ]);
      return {
        activeHackathons: events.content.length,
        totalHackathons: events.totalElements,
        unreadNotifications: unread,
      };
    },
  });
}
