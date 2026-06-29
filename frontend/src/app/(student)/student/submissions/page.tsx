import type { Metadata } from "next";
import { StudentSubmissionPage } from "@/features/submissions/components/student-submission-page";

export const metadata: Metadata = {
  title: "Submit — SEAL Hackathon",
  description: "Submit and update your entry for the current round.",
};

export default function SubmissionsRoute() {
  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <StudentSubmissionPage />
    </div>
  );
}
