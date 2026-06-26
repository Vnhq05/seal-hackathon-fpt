import type { Metadata } from "next";
import { EnrollmentApprovalPage } from "@/features/coordinator/components/enrollment-approval-page";

export const metadata: Metadata = {
  title: "Enrollments — SEAL Hackathon",
  description: "Approve or reject student event enrollments.",
};

export default function CoordinatorEnrollmentsRoute() {
  return <EnrollmentApprovalPage />;
}
