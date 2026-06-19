import type { Metadata } from "next";
import { ProfilePage } from "@/features/profile/components/profile-page";

export const metadata: Metadata = {
  title: "Settings — SEAL Hackathon Judge",
  description: "Manage your judge account settings.",
};

export default function JudgeSettingsRoute() {
  return <ProfilePage />;
}
