import { Suspense } from "react";
import { CoordinatorSubmissionDetailClient } from "./detail-client";

export default function CoordinatorSubmissionDetailRoute() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-seal-text-muted">Loading submission...</div>}>
      <CoordinatorSubmissionDetailClient />
    </Suspense>
  );
}
