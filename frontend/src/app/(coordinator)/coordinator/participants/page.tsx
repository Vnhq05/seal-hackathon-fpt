import type { Metadata } from "next";
import { ParticipantManagementPage } from "@/features/coordinator/components/participant-management-page";

export const metadata: Metadata = {
  title: "Participants — SEAL Hackathon",
  description: "View and manage hackathon participants.",
};

export default function ParticipantsRoute() {
  return <ParticipantManagementPage />;
}
