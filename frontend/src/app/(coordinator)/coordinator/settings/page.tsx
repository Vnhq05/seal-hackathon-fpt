import type { Metadata } from "next";
import { ProfilePage } from "@/features/profile/components/profile-page";

export const metadata: Metadata = {
  title: "Settings — SEAL Hackathon Staff",
  description: "Manage your staff account settings.",
};

export default function StaffSettingsRoute() {
  return <ProfilePage />;
}
