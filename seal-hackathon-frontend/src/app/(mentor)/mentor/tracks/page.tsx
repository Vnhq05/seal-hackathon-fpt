import type { Metadata } from "next";
import { MentorTrackPage } from "@/features/mentor/components/mentor-track-page";

export const metadata: Metadata = {
  title: "My Track — SEAL Hackathon",
  description: "View your assigned track details and team progress.",
};

export default function MentorTracksRoute() {
  return <MentorTrackPage />;
}
