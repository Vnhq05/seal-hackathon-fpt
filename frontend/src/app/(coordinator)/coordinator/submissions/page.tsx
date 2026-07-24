import { Suspense } from "react";
import { CoordinatorSubmissionsPage } from "@/features/submissions/components/coordinator-submissions-page";

export const metadata = {
  title: "Submissions — Coordinator",
  description: "Review team submission history and versions by event, round, and track.",
};

export default function CoordinatorSubmissionsRoute() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-seal-text-muted">Loading submissions...</div>}>
      <CoordinatorSubmissionsPage />
    </Suspense>
  );
}
