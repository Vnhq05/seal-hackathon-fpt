"use client";

import { useHackathonPage } from "@/features/events/hooks/use-hackathon-page";

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
              className="animate-pulse rounded-lg"
              style={{
                height: 200,
                backgroundColor: "rgba(223,226,236,0.8)",
              }}
            />
            <div
              className="animate-pulse rounded-lg"
              style={{
                height: 280,
                backgroundColor: "rgba(223,226,236,0.8)",
              }}
            />
          </div>
          <div className="col-span-4">
            <div
              className="animate-pulse rounded-lg"
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

/**
 * TODO: The old HackathonDetailPage relied on fields (longDescription, tracks,
 * timeline, judgingCriteria, rounds, keyDates, registration, bannerUrl) that do
 * not exist in the backend EventResponse. Those sub-components (HackathonHero,
 * HackathonAbout, HackathonTracks, HackathonTimeline, HackathonCriteriaTable,
 * HackathonRounds, HackathonDetailSidebar) need redesigning to use the actual
 * EventResponse shape plus separate API calls (criteriaApi, roundApi, etc.).
 *
 * For now this page shows a minimal view of the event data that actually exists.
 */
export function HackathonDetailPage({ hackathonId }: HackathonDetailPageProps) {
  const { data: event, isLoading } = useHackathonPage(hackathonId);

  if (isLoading) return <PageSkeleton />;

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

  return (
    <div className="flex flex-col">
      {/* Hero placeholder -- EventResponse does not include bannerUrl */}
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
        style={{ padding: "32px 24px" }}
      >
        {/* Main content */}
        <div className="col-span-8 flex flex-col gap-8">
          <div
            className="rounded-lg"
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
                <span style={{ fontSize: 14, color: "#8891a5" }}>
                  Start Date
                </span>
                <span style={{ fontSize: 14, color: "#0e1528" }}>
                  {new Date(event.startDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontSize: 14, color: "#8891a5" }}>
                  End Date
                </span>
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
                <span style={{ fontSize: 14, color: "#8891a5" }}>Rounds</span>
                <span style={{ fontSize: 14, color: "#0e1528" }}>
                  {event.roundCount}
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

          {/* TODO: Add sections for criteria (criteriaApi), rounds (roundApi),
              and other event details once the sub-components are updated to
              use the correct API types. */}
        </div>

        {/* Sidebar */}
        <div className="col-span-4">
          <div
            className="sticky top-8 rounded-lg"
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
            <div className="flex flex-col gap-2">
              <span style={{ fontSize: 14, color: "#8891a5" }}>
                Season: {event.season}
              </span>
              <span style={{ fontSize: 14, color: "#8891a5" }}>
                Year: {event.year}
              </span>
              <span style={{ fontSize: 14, color: "#8891a5" }}>
                Status: {event.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
