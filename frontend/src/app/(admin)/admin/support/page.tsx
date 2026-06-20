import type { Metadata } from "next";
import { SupportPageContent } from "@/features/support/components/support-page-content";

export const metadata: Metadata = {
  title: "Support — SEAL Hackathon Admin",
  description: "Get help with the admin console.",
};

export default function AdminSupportRoute() {
  return <SupportPageContent portalName="Admin" />;
}
