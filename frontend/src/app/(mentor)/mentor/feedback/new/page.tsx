import type { Metadata } from "next";
import { MentorFeedbackForm } from "@/features/mentor/components/mentor-feedback-form";

export const metadata: Metadata = {
  title: "New Feedback — SEAL Hackathon Mentor",
  description: "Submit feedback for a team.",
};

export default function MentorFeedbackNewRoute() {
  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <MentorFeedbackForm />
    </div>
  );
}
