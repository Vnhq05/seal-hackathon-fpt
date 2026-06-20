import Link from "next/link";
import type { HackathonRegistration } from "@/features/events/types/hackathon-detail.types";

interface HackathonRegistrationCardProps {
  registration: HackathonRegistration;
  hackathonId: string;
}

export function HackathonRegistrationCard({
  registration,
  hackathonId,
}: HackathonRegistrationCardProps) {
  const { team } = registration;

  return (
    <div
      className="relative flex flex-col items-center overflow-hidden rounded-lg"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid rgba(223,226,236,0.8)",
        padding: 25,
        boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
      }}
    >
      <div
        className="absolute left-0 right-0 top-0"
        style={{ height: 4, backgroundColor: "#38bdf8" }}
      />

      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: 64,
          height: 64,
          backgroundColor: "#38bdf8",
          marginTop: 8,
          marginBottom: 16,
        }}
      >
        <svg width="27" height="21" viewBox="0 0 27 21" fill="none" aria-hidden="true">
          <path
            d="M3 11l7 7L24 3"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h3
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: "#0e1528",
          letterSpacing: "-0.24px",
          lineHeight: "31.2px",
          textAlign: "center",
          paddingBottom: 4,
        }}
      >
        {registration.statusTitle}
      </h3>

      <p
        style={{
          fontSize: 14,
          color: "#8891a5",
          lineHeight: "21px",
          textAlign: "center",
          paddingBottom: 16,
        }}
      >
        {registration.statusDescription}
      </p>

      {team && (
        <div
          className="flex w-full items-center justify-between rounded-lg"
          style={{
            backgroundColor: "rgba(223,226,236,0.8)",
            border: "1px solid rgba(198,198,205,0.3)",
            padding: 9,
            marginBottom: 16,
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded"
              style={{
                width: 32,
                height: 32,
                backgroundColor: team.initialBgColor,
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  color: team.initialTextColor,
                  lineHeight: "18px",
                  textAlign: "center",
                }}
              >
                {team.initial}
              </span>
            </div>
            <div className="flex flex-col">
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#0e1528",
                  letterSpacing: "0.24px",
                  lineHeight: "12px",
                }}
              >
                {team.name}
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  color: "#8891a5",
                  lineHeight: "19.5px",
                }}
              >
                Team • {team.memberCount} Members
              </span>
            </div>
          </div>
          <Link href={`/participant/teams/${team.id}`} aria-label="Edit team">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path
                d="M11 2l2 2-8 8H3v-2l8-8z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      )}

      <Link
        href={`/participant/projects/${hackathonId}`}
        className="flex w-full items-center justify-center gap-1 rounded-lg"
        style={{
          backgroundColor: "#38bdf8",
          padding: 8,
          fontSize: 12,
          fontWeight: 500,
          color: "#ffffff",
          letterSpacing: "0.24px",
          lineHeight: "12px",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <path
            d="M2 4l5.5 4L2 12V4zM8 4l5.5 4L8 12V4z"
            stroke="white"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Go to Workspace
      </Link>
    </div>
  );
}
