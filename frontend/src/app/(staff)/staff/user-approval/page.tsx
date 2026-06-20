import type { Metadata } from "next";
import { UserApprovalPage } from "@/features/staff/components/user-approval-page";

export const metadata: Metadata = {
  title: "User Approval — SEAL Hackathon Staff",
  description: "Review and approve pending user registrations.",
};

export default function UserApprovalRoute() {
  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <UserApprovalPage />
    </div>
  );
}
