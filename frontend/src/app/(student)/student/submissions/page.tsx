import type { Metadata } from "next";
import { StudentSubmissionPage } from "@/features/submissions/components/student-submission-page";

export const metadata: Metadata = {
  title: "Nộp bài — SEAL Hackathon",
  description: "Nộp và cập nhật bài thi cho round hiện tại.",
};

export default function SubmissionsRoute() {
  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <StudentSubmissionPage />
    </div>
  );
}
