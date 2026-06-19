"use client";

import type { Notification, NotificationAction } from "@/features/notifications/types/notification.types";
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

function ActionButton({ action }: { action: NotificationAction }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: "#38bdf8",
      color: "#ffffff",
      border: "none",
    },
    danger: {
      backgroundColor: "#ffdad6",
      color: "#93000a",
      border: "none",
    },
    outline: {
      backgroundColor: "transparent",
      color: "#0e1528",
      border: "1px solid rgba(223,226,236,0.8)",
      borderRadius: "9999px",
    },
  };

  return (
    <button
      className="flex-shrink-0 whitespace-nowrap px-4 py-2 text-xs font-medium tracking-wide"
      style={{
        fontSize: "12px",
        lineHeight: "12px",
        letterSpacing: "0.24px",
        ...styles[action.variant],
      }}
    >
      {action.label}
    </button>
  );
}

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { mutate: markRead } = useMarkRead();
  const isUnread = !notification.isRead;

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
      className="flex cursor-pointer items-start gap-4 transition-colors"
      style={{
        backgroundColor: isUnread ? "#0e1528" : "#eef0f6",
        border: isUnread ? "1px solid #38bdf8" : "1px solid rgba(223,226,236,0.8)",
        borderLeftWidth: isUnread ? "3px" : "1px",
        borderRadius: "8px",
        padding: "25px 25px 25px 27px",
        opacity: isUnread ? 1 : 0.8,
      }}
    >
      <NotificationIcon type={notification.type} isRead={notification.isRead} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <p
            className="whitespace-nowrap"
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#0e1528",
              lineHeight: "25.2px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {notification.title}
          </p>
          <span
            className="flex-shrink-0 whitespace-nowrap"
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "#8891a5",
              lineHeight: "12px",
              letterSpacing: "0.24px",
            }}
          >
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>

        <p
          className="mt-1"
          style={{
            fontSize: "14px",
            fontWeight: 400,
            color: "#8891a5",
            lineHeight: "21px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {notification.message}
        </p>

        {notification.actions && notification.actions.some((a) => a.variant === "outline") && (
          <div className="mt-2 flex items-center gap-2">
            {notification.actions
              .filter((a) => a.variant === "outline")
              .map((action) => (
                <ActionButton key={action.label} action={action} />
              ))}
          </div>
        )}
      </div>

      {notification.actions && notification.actions.some((a) => a.variant !== "outline") && (
        <div className="flex flex-shrink-0 items-center gap-2">
          {notification.actions
            .filter((a) => a.variant !== "outline")
            .map((action) => (
              <ActionButton key={action.label} action={action} />
            ))}
        </div>
      )}

      {isUnread && (
        <div className="flex flex-shrink-0 flex-col items-start pt-2">
          <span
            className="rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: "#38bdf8",
              display: "block",
            }}
          />
        </div>
      )}
    </div>
  );
}
