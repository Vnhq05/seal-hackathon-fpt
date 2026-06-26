"use client";

import Link from "next/link";
import { usePublicEvent } from "@/features/events/hooks/use-public-event";
import { RegistrationHeader } from "@/features/events/components/registration-header";
import { RegistrationInfoBox } from "@/features/events/components/registration-info-box";
import { RegistrationFactsGrid } from "@/features/events/components/registration-facts-grid";
import { RegistrationForm } from "@/features/events/components/registration-form";
import { ExternalRegistrationForm } from "@/features/events/components/external-registration-form";
import { useAuthStore } from "@/features/auth/store/auth.store";

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
  const { user, isAuthenticated } = useAuthStore();
  const { data: hackathon, isLoading, isError } = usePublicEvent(hackathonId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={bgStyle}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
          <p style={{ fontSize: 14, color: "#8891a5" }}>Loading hackathon details...</p>
        </div>
      </div>
    );
  }

  if (isError || !hackathon) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={bgStyle}>
        <div className="flex flex-col items-center gap-4">
          <p style={{ fontSize: 18, fontWeight: 600, color: "#0e1528" }}>Hackathon not found</p>
          <p style={{ fontSize: 14, color: "#8891a5" }}>
            The hackathon you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const isStudent =
    isAuthenticated &&
    (user?.userType === "FPT_STUDENT" || user?.userType === "EXTERNAL_STUDENT");

  const infoDescription = isStudent
    ? `There is no cost to participate in ${hackathon.name}. Enroll now and create your team later from the Teams page.`
    : `Register for ${hackathon.name} with a temporary external-student account. This form is separate from Create Account on the login page.`;

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-[120px]"
      style={bgStyle}
    >
      <div className="w-full max-w-[560px]">
        <div className="flex w-full flex-col gap-6" style={cardStyle}>
          <RegistrationHeader hackathon={hackathon} />
          <RegistrationInfoBox title="Registration is free" description={infoDescription} />
          <RegistrationFactsGrid hackathon={hackathon} />

          {isStudent ? (
            <RegistrationForm hackathonId={hackathonId} />
          ) : (
            <ExternalRegistrationForm eventId={hackathonId} eventName={hackathon.name} />
          )}

          {!isStudent && (
            <p className="text-center text-xs text-seal-text-muted">
              One participant can only join one event at a time. Withdraw from your current event before registering for another.
            </p>
          )}

          {isAuthenticated && user?.userType !== "FPT_STUDENT" && user?.userType !== "EXTERNAL_STUDENT" && (
            <p className="text-center text-sm text-amber-700">
              This registration form is for students only.{" "}
              <Link href="/student" className="underline">Go to your dashboard</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
