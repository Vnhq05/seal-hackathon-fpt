import type { Metadata } from "next";
import { MentorFeedbackForm } from "@/features/lecturer-mentor/components/mentor-feedback-form";

export const metadata: Metadata = {
  title: "New Feedback — SEAL Hackathon Lecturer",
};

export default function LecturerFeedbackNewRoute() {
  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <MentorFeedbackForm />
    </div>
  );
}
