import type { NotificationTab } from "@/features/notifications/hooks/use-notifications";

interface NotificationEmptyProps {
  tab: NotificationTab;
}

export function NotificationEmpty({ tab }: NotificationEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center border-2 border-dashed border-navy/30 bg-seal-surface-sunken py-20 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center border-2 border-navy bg-white shadow-[2px_2px_0_0_#0c1228]">
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
      <p className="font-mono text-base font-bold text-navy">
        {tab === "unread" ? "No unread notifications" : "No notifications yet"}
      </p>
      <p className="mt-1 max-w-[280px] text-sm text-seal-text-muted">
        {tab === "unread"
          ? "You're all caught up! Check back later for updates."
          : "When you receive notifications, they'll appear here."}
      </p>
    </div>
  );
}
