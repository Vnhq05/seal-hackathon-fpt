"use client";

import type { NotificationResponse } from "@/lib/api";
import { NotificationIcon } from "@/features/notifications/components/notification-icon";
import { useMarkRead } from "@/features/notifications/hooks/use-mark-read";

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface NotificationItemProps {
  notification: NotificationResponse;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { mutate: markRead } = useMarkRead();
  const isUnread = !notification.read;

  const handleClick = () => {
    if (isUnread) {
      markRead(notification.id);
    }
  };

  return (
    <div
      role="listitem"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className={`flex cursor-pointer items-start gap-4 border-2 p-6 transition-colors shadow-[2px_2px_0_0_#0c1228] ${
        isUnread
          ? "border-navy bg-navy text-white"
          : "border-navy/30 bg-white opacity-80"
      }`}
    >
      <NotificationIcon type={notification.type} isRead={notification.read} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <p
            className={`whitespace-nowrap text-lg font-semibold ${isUnread ? "text-white" : "text-navy"}`}
          >
            {notification.title}
          </p>
          <span className="flex-shrink-0 whitespace-nowrap text-xs font-medium text-seal-text-muted">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>

        <p className="mt-1 text-sm text-seal-text-muted">
          {notification.message}
        </p>
      </div>

      {isUnread && (
        <div className="flex flex-shrink-0 flex-col items-start pt-2">
          <span className="block h-2 w-2 rounded-full bg-royal" />
        </div>
      )}
    </div>
  );
}
