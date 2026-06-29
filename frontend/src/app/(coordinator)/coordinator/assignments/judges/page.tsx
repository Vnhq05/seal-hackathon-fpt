import type { Metadata } from "next";
import { JudgeAssignmentPage } from "@/features/admin/components/judge-assignment-page";

export const metadata: Metadata = {
  title: "Judge Pool Assignment — SEAL Hackathon",
};

export default function CoordinatorJudgePoolPage() {
  return <JudgeAssignmentPage />;
}
