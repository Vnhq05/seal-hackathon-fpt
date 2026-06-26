import type { Metadata } from "next";
import { JudgeAssignmentsPage } from "@/features/admin/components/judge-assignments-page";

export const metadata: Metadata = {
  title: "Judge Assignments — SEAL Hackathon",
};

export default function CoordinatorAssignmentsPage() {
  return <JudgeAssignmentsPage />;
}
