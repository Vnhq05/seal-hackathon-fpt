import type { Metadata } from "next";
import { DashboardPage } from "@/features/dashboard/components/dashboard-page";

export const metadata: Metadata = {
  title: "Dashboard — SEAL Hackathon",
  description: "Your SEAL Hackathon participant overview.",
};

export default function ParticipantRoot() {
  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <DashboardPage />
    </div>
  );
}
