import type { Metadata } from "next";
import { NotificationPage } from "@/features/notifications/components/notification-page";

export const metadata: Metadata = {
  title: "Notifications — SEAL Hackathon Judge",
  description: "View your judge notifications.",
};

export default function JudgeNotificationsRoute() {
  return <NotificationPage />;
}
