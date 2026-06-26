import type { Metadata } from "next";
import { CoordinatorDashboardPage } from "@/features/coordinator/components/coordinator-dashboard-page";

export const metadata: Metadata = {
  title: "Coordinator Dashboard — SEAL Hackathon",
};

export default function CoordinatorHomePage() {
  return <CoordinatorDashboardPage />;
}
