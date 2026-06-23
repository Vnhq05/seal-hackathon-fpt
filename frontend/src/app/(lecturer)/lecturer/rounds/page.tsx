import type { Metadata } from "next";
import { AssignedRoundsPage } from "@/features/judging/components/assigned-rounds-page";

export const metadata: Metadata = {
  title: "Assigned Rounds — SEAL Hackathon Lecturer",
};

export default function LecturerRoundsRoute() {
  return <AssignedRoundsPage />;
}
