import type { Metadata } from "next";
import { LecturerDashboardPage } from "@/features/lecturer/components/lecturer-dashboard-page";

export const metadata: Metadata = {
  title: "Lecturer Dashboard — SEAL Hackathon",
  description: "Combined judging and mentoring overview.",
};

export default function LecturerDashboardRoute() {
  return <LecturerDashboardPage />;
}
