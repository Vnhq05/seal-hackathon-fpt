import type { Metadata } from "next";
import { ProfilePage } from "@/features/profile/components/profile-page";

export const metadata: Metadata = {
  title: "Settings — SEAL Hackathon Lecturer",
  description: "Manage your lecturer account settings.",
};

export default function LecturerSettingsRoute() {
  return <ProfilePage />;
}
