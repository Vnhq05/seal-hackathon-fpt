import type { Metadata } from "next";
import { AssignedRoundsPage } from "@/features/judging/components/assigned-rounds-page";

export const metadata: Metadata = {
  title: "Assigned Rounds — SEAL Hackathon",
  description: "View your assigned judging rounds.",
};

export default function AssignedRoundsRoute() {
  return <AssignedRoundsPage />;
}
