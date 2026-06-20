import type { Metadata } from "next";
import { ProfilePage } from "@/features/profile/components/profile-page";

export const metadata: Metadata = {
  title: "Settings — SEAL Hackathon Mentor",
  description: "Manage your mentor account settings.",
};

export default function MentorSettingsRoute() {
  return <ProfilePage />;
}
