import { ParticipantFeedbackPage } from "@/features/feedback/components/participant-feedback-page";

export const metadata = {
  title: "Feedback — SEAL Hackathon",
  description: "Share your post-event feedback.",
};

export default function StudentFeedbackRoute() {
  return <ParticipantFeedbackPage />;
}
