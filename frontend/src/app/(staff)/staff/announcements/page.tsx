import type { Metadata } from "next";
import { AnnouncementManagementPage } from "@/features/staff/components/announcement-management-page";

export const metadata: Metadata = {
  title: "Announcements — SEAL Hackathon Staff",
  description: "Create and manage announcements.",
};

export default function AnnouncementsRoute() {
  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <AnnouncementManagementPage />
    </div>
  );
}
