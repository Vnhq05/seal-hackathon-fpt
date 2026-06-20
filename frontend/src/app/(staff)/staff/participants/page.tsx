import type { Metadata } from "next";
import { ParticipantManagementPage } from "@/features/staff/components/participant-management-page";

export const metadata: Metadata = {
  title: "Participants — SEAL Hackathon Staff",
  description: "View and manage all hackathon participants.",
};

export default function ParticipantsRoute() {
  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <ParticipantManagementPage />
    </div>
  );
}
