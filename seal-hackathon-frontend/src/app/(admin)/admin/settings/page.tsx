import type { Metadata } from "next";
import { ProfilePage } from "@/features/profile/components/profile-page";

export const metadata: Metadata = {
  title: "Settings — SEAL Hackathon Admin",
  description: "Manage your admin account settings.",
};

export default function AdminSettingsRoute() {
  return <ProfilePage />;
}
