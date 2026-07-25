import type { Metadata } from "next";
import { AssignmentOverviewPage } from "@/features/admin/components/assignment-overview-page";

export const metadata: Metadata = {
  title: "Assignment Overview — SEAL Hackathon",
};

export default function AdminAssignmentOverviewRoutePage() {
  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <AssignmentOverviewPage />
    </div>
  );
}
