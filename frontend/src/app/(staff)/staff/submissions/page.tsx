import type { Metadata } from "next";
import { SubmissionManagementPage } from "@/features/staff/components/submission-management-page";

export const metadata: Metadata = {
  title: "Submissions — SEAL Hackathon Staff",
  description: "Review and manage all hackathon submissions.",
};

export default function SubmissionsRoute() {
  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <SubmissionManagementPage />
    </div>
  );
}
