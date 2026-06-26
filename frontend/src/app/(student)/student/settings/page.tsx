import type { Metadata } from "next";
import { ProfilePage } from "@/features/profile/components/profile-page";

export const metadata: Metadata = {
  title: "Settings — SEAL Hackathon",
  description: "Manage your account settings and profile.",
};

export default function StudentSettingsRoute() {
  return <ProfilePage />;
}
