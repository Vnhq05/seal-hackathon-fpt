import type { Metadata } from "next";
import { SupportPageContent } from "@/features/support/components/support-page-content";

export const metadata: Metadata = {
  title: "Support — SEAL Hackathon Judge",
  description: "Get help with the judge portal.",
};

export default function JudgeSupportRoute() {
  return <SupportPageContent portalName="Judge" />;
}
