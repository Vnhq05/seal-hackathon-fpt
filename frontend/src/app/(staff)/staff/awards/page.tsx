import type { Metadata } from "next";
import { AwardManagementPage } from "@/features/staff/components/award-management-page";

export const metadata: Metadata = {
  title: "Awards — SEAL Hackathon Staff",
  description: "Create and manage hackathon awards.",
};

export default function AwardsRoute() {
  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <AwardManagementPage />
    </div>
  );
}
