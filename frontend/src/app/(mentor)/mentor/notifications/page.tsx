import type { Metadata } from "next";
import { NotificationPage } from "@/features/notifications/components/notification-page";

export const metadata: Metadata = {
  title: "Notifications — SEAL Hackathon Mentor",
  description: "View your mentor notifications.",
};

export default function MentorNotificationsRoute() {
  return <NotificationPage />;
}
