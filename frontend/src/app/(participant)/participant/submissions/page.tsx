import type { Metadata } from "next";
import { SubmissionsPage } from "@/features/submissions/components/submissions-page";

export const metadata: Metadata = {
  title: "Submissions — SEAL Hackathon",
  description: "Track your project submissions and review status.",
};

export default function SubmissionsRoute() {
  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <SubmissionsPage />
    </div>
  );
}
