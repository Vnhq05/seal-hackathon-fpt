import type { Metadata } from "next";
import { SupportPageContent } from "@/features/support/components/support-page-content";

export const metadata: Metadata = {
  title: "Support — SEAL Hackathon Mentor",
  description: "Get help with the mentor portal.",
};

export default function MentorSupportRoute() {
  return <SupportPageContent portalName="Mentor" />;
}
