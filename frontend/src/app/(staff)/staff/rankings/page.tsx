import type { Metadata } from "next";
import { RankingManagementPage } from "@/features/staff/components/ranking-management-page";

export const metadata: Metadata = {
  title: "Rankings — SEAL Hackathon Staff",
  description: "View and override team rankings.",
};

export default function RankingsRoute() {
  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <RankingManagementPage />
    </div>
  );
}
