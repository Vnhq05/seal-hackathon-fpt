import type { Metadata } from "next";
import { JudgeAssignmentsPage } from "@/features/admin/components/judge-assignments-page";

export const metadata: Metadata = {
  title: "Phân công Judge — SEAL Hackathon",
};

export default function AdminAssignmentsPage() {
  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <JudgeAssignmentsPage />
    </div>
  );
}
