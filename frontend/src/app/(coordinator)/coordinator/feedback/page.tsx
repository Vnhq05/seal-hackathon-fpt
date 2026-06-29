import { ParticipantFeedbackReviewPage } from "@/features/feedback/components/participant-feedback-review-page";

export const metadata = {
  title: "Participant Feedback — Coordinator",
  description: "Review post-event participant feedback.",
};

export default function CoordinatorFeedbackRoute() {
  return <ParticipantFeedbackReviewPage />;
}
