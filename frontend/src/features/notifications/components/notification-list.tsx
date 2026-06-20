import type { NotificationResponse } from "@/lib/api";
import type { NotificationTab } from "@/features/notifications/hooks/use-notifications";
import { NotificationItem } from "@/features/notifications/components/notification-item";
import { NotificationSkeleton } from "@/features/notifications/components/notification-skeleton";
import { NotificationEmpty } from "@/features/notifications/components/notification-empty";

interface NotificationListProps {
  notifications: NotificationResponse[];
  isLoading: boolean;
  tab: NotificationTab;
}

export function NotificationList({ notifications, isLoading, tab }: NotificationListProps) {
  if (isLoading) {
    return <NotificationSkeleton />;
  }

  if (notifications.length === 0) {
    return <NotificationEmpty tab={tab} />;
  }

  return (
    <div role="list" className="flex flex-col gap-2">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}
