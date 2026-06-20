import type { Metadata } from "next";
import { PromotionManagementPage } from "@/features/staff/components/promotion-management-page";

export const metadata: Metadata = {
  title: "Promotions — SEAL Hackathon Staff",
  description: "Promote teams between hackathon rounds.",
};

export default function PromotionsRoute() {
  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <PromotionManagementPage />
    </div>
  );
}
