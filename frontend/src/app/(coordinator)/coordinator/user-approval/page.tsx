import type { Metadata } from "next";
import { UserApprovalPage } from "@/features/coordinator/components/user-approval-page";

export const metadata: Metadata = {
  title: "User Approval — SEAL Hackathon",
  description: "Review and approve pending user registrations.",
};

export default function UserApprovalRoute() {
  return <UserApprovalPage />;
}
