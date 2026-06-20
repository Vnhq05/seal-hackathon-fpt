import { useQuery } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api";

export const NOTIFICATIONS_QUERY_KEY = "notifications" as const;

export type NotificationTab = "all" | "unread";

export function useNotifications(tab: NotificationTab) {
  return useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, tab],
    queryFn: () =>
      tab === "unread"
        ? notificationApi.getUnread()
        : notificationApi.getAll(),
  });
}
