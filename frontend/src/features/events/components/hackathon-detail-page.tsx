"use client";

import Link from "next/link";
import { useHackathonPage } from "@/features/events/hooks/use-hackathon-page";
import { useEventRounds } from "@/features/events/hooks/use-event-rounds";
import { HackathonRounds } from "@/features/events/components/hackathon-rounds";
import { HackathonCriteriaTable } from "@/features/events/components/hackathon-criteria-table";
import type { RoundResponse } from "@/lib/api/round.api";
import type { CompetitionRound, JudgingCriterion } from "@/features/events/types/hackathon-detail.types";
import { DEFAULT_MAX_SCORE, DEFAULT_MIN_SCORE } from "@/features/judging/constants/scoring-scale";
import { useEventParticipationGate } from "@/features/events/hooks/use-event-participation-gate";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { ParticipationBlockBanner } from "@/features/events/components/participation-block-banner";
import { useAuthStore } from "@/features/auth/store/auth.store";

interface HackathonDetailPageProps {
  hackathonId: string;
}

function PageSkeleton() {
  return (
    <div className="flex flex-col">
      <div
        className="animate-pulse"
        style={{ height: 397, backgroundColor: "rgba(223,226,236,0.8)" }}
      />
      <div className="p-8" style={{ maxWidth: 1280 }}>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 flex flex-col gap-8">
            <div
              className="animate-pulse"
              style={{
                height: 200,
                backgroundColor: "rgba(223,226,236,0.8)",
              }}
            />
            <div
              className="animate-pulse"
              style={{
                height: 280,
                backgroundColor: "rgba(223,226,236,0.8)",
              }}
            />
          </div>
          <div className="col-span-4">
            <div
              className="animate-pulse"
              style={{
                height: 350,
                backgroundColor: "rgba(223,226,236,0.8)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function mapRounds(rounds: RoundResponse[]): CompetitionRound[] {
  return rounds.map((round) => ({
    id: round.id,
    title: `Round ${round.roundNumber}: ${round.name}`,
    description: `Submission deadline: ${new Date(round.submissionDeadline).toLocaleString()} · Scoring deadline: ${new Date(round.scoringDeadline).toLocaleString()}`,
  }));
}

function mapCriteria(rounds: RoundResponse[]): JudgingCriterion[] {
  const criteriaRound = [...rounds].sort((a, b) => a.roundNumber - b.roundNumber)[0];
  if (!criteriaRound?.criteria?.length) return [];

  return criteriaRound.criteria.map((criterion) => ({
    id: criterion.id,
    name: criterion.name,
    description: criterion.description ?? "",
    weight: criterion.weight,
    minScore: criterion.minScore ?? DEFAULT_MIN_SCORE,
    maxScore: criterion.maxScore ?? DEFAULT_MAX_SCORE,
  }));
}

export function HackathonDetailPage({ hackathonId }: HackathonDetailPageProps) {
  const { data: event, isLoading: eventLoading } = useHackathonPage(hackathonId);
  const { data: rounds = [], isLoading: roundsLoading } = useEventRounds(hackathonId);
  const { isAuthenticated } = useAuthStore();
  const { data: profile } = useProfile({ enabled: isAuthenticated });
  const userEligibility =
    isAuthenticated && profile
      ? {
          studentStanding: profile.studentStanding ?? "ENROLLED" as const,
          semester: profile.semester,
        }
      : undefined;
  const { canEnroll, enrollmentBlockReason, registrationClosedReason } =
    useEventParticipationGate(event ?? undefined, userEligibility);
  const showRegisterCta =
    !!event &&
    (event.status === "OPEN" || event.status === "ACTIVE") &&
    canEnroll;
  const registerBlockReason = enrollmentBlockReason ?? registrationClosedReason;

  if (eventLoading || roundsLoading) return <PageSkeleton />;

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p style={{ fontSize: 18, fontWeight: 600, color: "#0e1528" }}>
          Hackathon not found
        </p>
        <p style={{ fontSize: 14, color: "#8891a5", marginTop: 4 }}>
          The hackathon you are looking for does not exist or has been removed.
        </p>
      </div>
    );
  }

  const competitionRounds = mapRounds(rounds);
  const judgingCriteria = mapCriteria(rounds);

  return (
    <div className="flex flex-col">
      <div
        className="relative flex flex-col items-start justify-end"
        style={{
          height: 280,
          backgroundColor: "rgba(223,226,236,0.8)",
          padding: "32px 24px",
        }}
      >
        <span
          className="mb-2 inline-block rounded px-2 py-1"
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#fff",
            backgroundColor:
              event.status === "ACTIVE"
                ? "rgba(16, 185, 129, 0.9)"
                : event.status === "COMPLETED"
                  ? "#8891a5"
                  : "rgba(245, 158, 11, 0.9)",
          }}
        >
          {event.status}
        </span>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#0e1528",
            lineHeight: "38.4px",
          }}
        >
          {event.name}
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", marginTop: 4 }}>
          {event.season} {event.year}
        </p>
      </div>

      <div
        className="grid grid-cols-12 gap-8"
        style={{ padding: "32px 24px", maxWidth: 1280, margin: "0 auto", width: "100%" }}
      >
        <div className="col-span-8 flex flex-col gap-8">
          {event.description && (
            <div
              className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid rgba(223,226,236,0.8)",
                padding: 24,
              }}
            >
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#0e1528",
                  marginBottom: 16,
                }}
              >
                About
              </h2>
              <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px" }}>
                {event.description}
              </p>
            </div>
          )}

          {competitionRounds.length > 0 && (
            <HackathonRounds rounds={competitionRounds} />
          )}

          {judgingCriteria.length > 0 && (
            <HackathonCriteriaTable criteria={judgingCriteria} />
          )}

          <div
            className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid rgba(223,226,236,0.8)",
              padding: 24,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "#0e1528",
                marginBottom: 16,
              }}
            >
              Event Details
            </h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between">
                <span style={{ fontSize: 14, color: "#8891a5" }}>Start Date</span>
                <span style={{ fontSize: 14, color: "#0e1528" }}>
                  {new Date(event.startDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontSize: 14, color: "#8891a5" }}>End Date</span>
                <span style={{ fontSize: 14, color: "#0e1528" }}>
                  {new Date(event.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontSize: 14, color: "#8891a5" }}>
                  Registration Deadline
                </span>
                <span style={{ fontSize: 14, color: "#0e1528" }}>
                  {new Date(event.registrationDeadline).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontSize: 14, color: "#8891a5" }}>Tracks</span>
                <span style={{ fontSize: 14, color: "#0e1528" }}>
                  {event.trackCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontSize: 14, color: "#8891a5" }}>Mentors</span>
                <span style={{ fontSize: 14, color: "#0e1528" }}>
                  {event.mentorCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-4">
          <div
            className="sticky top-8 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid rgba(223,226,236,0.8)",
              padding: 24,
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#0e1528",
                marginBottom: 12,
              }}
            >
              Quick Info
            </h3>
            <div className="mb-4 flex flex-col gap-2">
              <span style={{ fontSize: 14, color: "#8891a5" }}>
                Season: {event.season}
              </span>
              <span style={{ fontSize: 14, color: "#8891a5" }}>
                Year: {event.year}
              </span>
              <span style={{ fontSize: 14, color: "#8891a5" }}>
                Status: {event.status}
              </span>
              {event.location && (
                <span style={{ fontSize: 14, color: "#8891a5" }}>
                  Location: {event.location}
                </span>
              )}
            </div>
            {(event.status === "OPEN" || event.status === "ACTIVE") && (
              <div className="flex flex-col gap-2">
                {showRegisterCta ? (
                  <Link
                    href={`/hackathons/${hackathonId}/register`}
                    className="flex items-center justify-center border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
                    style={{
                      backgroundColor: "#059669",
                      color: "#ffffff",
                      fontSize: 14,
                      fontWeight: 600,
                      padding: "10px 16px",
                    }}
                  >
                    Register now
                  </Link>
                ) : (
                  <>
                    <span
                      className="flex items-center justify-center"
                      style={{
                        backgroundColor: "#e5e7eb",
                        color: "#6b7280",
                        fontSize: 14,
                        fontWeight: 600,
                        padding: "10px 16px",
                        cursor: "not-allowed",
                      }}
                    >
                      Registration unavailable
                    </span>
                    {registerBlockReason && (
                      <ParticipationBlockBanner reason={registerBlockReason} />
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
