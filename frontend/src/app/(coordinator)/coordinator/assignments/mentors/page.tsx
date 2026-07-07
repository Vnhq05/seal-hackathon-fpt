import type { Metadata } from "next";
import { MentorAssignmentPage } from "@/features/admin/components/mentor-assignment-page";

export const metadata: Metadata = {
  title: "Mentor Assignment — SEAL Hackathon",
};

export default function CoordinatorMentorAssignmentPage() {
  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <MentorAssignmentPage />
    </div>
  );
}
