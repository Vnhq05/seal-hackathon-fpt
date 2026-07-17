import { ParticipantFeedbackReviewPage } from "@/features/feedback/components/participant-feedback-review-page";

export const metadata = {
  title: "Participant Feedback — Admin",
  description: "Review post-event participant feedback.",
};

export default function AdminFeedbackRoute() {
  return <ParticipantFeedbackReviewPage />;
}
