import type { Metadata } from "next";
import { HackathonRegistrationPage } from "@/features/events/components/hackathon-registration-page";

export const metadata: Metadata = {
  title: "Register for Hackathon — SEAL Hackathon",
  description: "Complete your hackathon registration.",
};

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <HackathonRegistrationPage hackathonId={id} />;
}
