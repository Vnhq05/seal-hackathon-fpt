import type { Metadata } from "next";
import { SupportPageContent } from "@/features/support/components/support-page-content";

export const metadata: Metadata = {
  title: "Support — SEAL Hackathon Staff",
  description: "Get help with the staff portal.",
};

export default function StaffSupportRoute() {
  return <SupportPageContent portalName="Staff" />;
}
