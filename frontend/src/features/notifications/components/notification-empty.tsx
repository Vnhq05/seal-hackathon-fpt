import type { NotificationTab } from "@/features/notifications/hooks/use-notifications";

interface NotificationEmptyProps {
  tab: NotificationTab;
}

export function NotificationEmpty({ tab }: NotificationEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="mb-5 flex items-center justify-center rounded-full"
        style={{ width: 64, height: 64, backgroundColor: "#eef0f6" }}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <path
            d="M14 4a7 7 0 017 7v3l2 3H5l2-3v-3a7 7 0 017-7z"
            stroke="#38bdf8"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M11.5 17a2.5 2.5 0 005 0"
            stroke="#38bdf8"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p style={{ fontSize: "16px", fontWeight: 600, color: "#0e1528", lineHeight: "24px" }}>
        {tab === "unread" ? "No unread notifications" : "No notifications yet"}
      </p>
      <p
        className="mt-1"
        style={{ fontSize: "14px", color: "rgba(101,217,243,0.2)", lineHeight: "21px", maxWidth: 280 }}
      >
        {tab === "unread"
          ? "You're all caught up! Check back later for updates."
          : "When you receive notifications, they'll appear here."}
      </p>
    </div>
  );
}
