import type { Metadata } from "next";
import { NotificationPage } from "@/features/notifications/components/notification-page";

export const metadata: Metadata = {
  title: "Notifications — SEAL Hackathon",
  description: "Stay up to date with your hackathon activity and updates.",
};

export default function NotificationsRoute() {
  return (
    <div className="w-full px-[72px]">
      <div className="w-full" style={{ maxWidth: 896, padding: 32 }}>
        <NotificationPage />
      </div>
    </div>
  );
}
