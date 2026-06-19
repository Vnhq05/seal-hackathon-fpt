import type { Metadata } from "next";
import { ProfilePage } from "@/features/profile/components/profile-page";

export const metadata: Metadata = {
  title: "My Profile — SEAL Hackathon",
  description: "View and update your SEAL Hackathon profile.",
};

export default function UserProfilePage() {
  return (
    <div
      style={{
        padding: "32px 72px",
        maxWidth: 896 + 144,
        background: "linear-gradient(90deg, #06110f 0%, #06110f 100%)",
        minHeight: "100%",
      }}
    >
      <div style={{ maxWidth: 896 }}>
        <ProfilePage />
      </div>
    </div>
  );
}
