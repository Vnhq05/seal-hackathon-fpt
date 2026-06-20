import type { Metadata } from "next";
import { Suspense } from "react";
import { DisqualificationPage } from "@/features/staff/components/disqualification-page";

export const metadata: Metadata = {
  title: "Disqualify Team — SEAL Hackathon Staff",
  description: "Submit a team disqualification request.",
};

export default function DisqualificationRoute() {
  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <Suspense fallback={
        <div className="animate-pulse rounded-lg" style={{ height: 400, backgroundColor: "#e4e2e4" }} />
      }>
        <DisqualificationPage />
      </Suspense>
    </div>
  );
}
