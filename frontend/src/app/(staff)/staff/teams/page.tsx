import type { Metadata } from "next";
import { TeamManagementPage } from "@/features/staff/components/team-management-page";

export const metadata: Metadata = {
  title: "Teams — SEAL Hackathon Staff",
  description: "View and manage all hackathon teams.",
};

export default function TeamsRoute() {
  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <TeamManagementPage />
    </div>
  );
}
