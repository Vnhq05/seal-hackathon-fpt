import { apiClient } from "@/lib/axios";
import type {
  Notification,
  NotificationListResponse,
  NotificationTab,
} from "@/features/notifications/types/notification.types";

export async function fetchNotifications(
  tab: NotificationTab,
): Promise<NotificationListResponse> {
  const params: Record<string, string> = {};
  if (tab !== "all") {
    params.filter = tab;
  }
  const { data } = await apiClient.get<NotificationListResponse>("/notifications", {
    params,
  });
  return data;
}

export async function markNotificationAsRead(id: string): Promise<Notification> {
  const { data } = await apiClient.put<Notification>(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.put("/notifications/read-all");
}
