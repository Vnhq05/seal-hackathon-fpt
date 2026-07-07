import type { Metadata } from "next";
import { Suspense } from "react";
import { JudgeAssignmentsPage } from "@/features/admin/components/judge-assignments-page";

export const metadata: Metadata = {
  title: "Judge Assignments — SEAL Hackathon",
};

export default function AdminAssignmentsPage() {
  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <Suspense fallback={<div className="text-sm text-seal-text-muted">Loading assignments...</div>}>
        <JudgeAssignmentsPage />
      </Suspense>
    </div>
  );
}
