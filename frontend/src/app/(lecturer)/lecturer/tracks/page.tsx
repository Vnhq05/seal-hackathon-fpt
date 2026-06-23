import type { Metadata } from "next";
import { MentorTrackPage } from "@/features/mentor/components/mentor-track-page";

export const metadata: Metadata = {
  title: "My Tracks — SEAL Hackathon Lecturer",
};

export default function LecturerTracksRoute() {
  return <MentorTrackPage />;
}
