"use client";

import { useHackathonDetail } from "@/features/events/hooks/use-hackathon-detail";
import { RegistrationHeader } from "@/features/events/components/registration-header";
import { RegistrationInfoBox } from "@/features/events/components/registration-info-box";
import { RegistrationFactsGrid } from "@/features/events/components/registration-facts-grid";
import { RegistrationForm } from "@/features/events/components/registration-form";

const bgStyle: React.CSSProperties = { backgroundColor: "#eef0f6" };

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8,
  padding: "25px 25px 39px",
  boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
};

interface HackathonRegistrationPageProps {
  hackathonId: string;
}

export function HackathonRegistrationPage({
  hackathonId,
}: HackathonRegistrationPageProps) {
  const { data: hackathon, isLoading, isError } = useHackathonDetail(hackathonId);

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={bgStyle}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
          <p style={{ fontSize: 14, color: "#8891a5" }}>
            Loading hackathon details...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !hackathon) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={bgStyle}
      >
        <div className="flex flex-col items-center gap-4">
          <p style={{ fontSize: 18, fontWeight: 600, color: "#0e1528" }}>
            Hackathon not found
          </p>
          <p style={{ fontSize: 14, color: "#8891a5" }}>
            The hackathon you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
        </div>
      </div>
    );
  }

  const isFree =
    hackathon.registrationFee === null || hackathon.registrationFee === 0;

  const infoTitle = isFree
    ? "Registration is free"
    : `Registration fee: $${hackathon.registrationFee}`;

  const infoDescription = isFree
    ? `There is no cost to participate in ${hackathon.name}. All meals, swag, and workspace access are provided.`
    : `The registration fee for ${hackathon.name} is $${hackathon.registrationFee}.`;

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-[120px]"
      style={bgStyle}
    >
      <div className="w-full max-w-[560px]">
        <div className="flex w-full flex-col gap-6" style={cardStyle}>
          <RegistrationHeader hackathon={hackathon} />
          <RegistrationInfoBox title={infoTitle} description={infoDescription} />
          <RegistrationFactsGrid hackathon={hackathon} />
          <RegistrationForm hackathonId={hackathonId} />
        </div>
      </div>
    </div>
  );
}
