import type { Metadata } from "next";
import { StaffDashboardPage } from "@/features/staff/components/staff-dashboard-page";

export const metadata: Metadata = {
  title: "Staff Dashboard — SEAL Hackathon",
  description: "Overview of hackathon operations and pending tasks.",
};

export default function StaffRoot() {
  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <StaffDashboardPage />
    </div>
  );
}
