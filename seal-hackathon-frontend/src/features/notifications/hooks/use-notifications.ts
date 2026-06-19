import { useQuery } from "@tanstack/react-query";
import { fetchNotifications } from "@/features/notifications/services/notification.service";
import type { NotificationTab } from "@/features/notifications/types/notification.types";

export const NOTIFICATIONS_QUERY_KEY = "notifications" as const;

export function useNotifications(tab: NotificationTab) {
  return useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, tab],
    queryFn: () => fetchNotifications(tab),
  });
}
