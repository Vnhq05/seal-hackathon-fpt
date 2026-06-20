import type { TrackDetail, SubmissionRound } from "@/features/teams/types/team.types";

interface TeamDetailTrackProps {
  track: TrackDetail;
  rounds: SubmissionRound[];
}

function MentorIcon() {
  return (
    <svg width="15" height="12" viewBox="0 0 15 12" fill="none" aria-hidden="true">
      <circle cx="5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M0 11c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="11" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M15 11c0-2.21-1.79-4-4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 10l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg width="19" height="21" viewBox="0 0 19 21" fill="none" aria-hidden="true">
      <path d="M9.5 2C7 6 6.5 10 6.5 14h6c0-4-.5-8-3-12z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6.5 14l-3 3M12.5 14l3 3M9.5 17v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="21" viewBox="0 0 16 21" fill="none" aria-hidden="true">
      <rect x="1" y="9" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 9V6a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <circle cx="5" cy="5" r="4.5" stroke="#ba1a1a" strokeWidth="1" />
      <path d="M5 3v3M5 7.5h.01" stroke="#ba1a1a" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function RoundRow({ round }: { round: SubmissionRound }) {
  const isActive = round.status === "pending";
  const isLocked = round.status === "not_open";

  return (
    <div
      className="flex items-center justify-between rounded-lg"
      style={{
        backgroundColor: isActive ? "#ffffff" : isLocked ? "#0e1528" : "rgba(223,226,236,0.8)",
        border: isActive ? "2px solid #bec6e0" : "1px solid rgba(223,226,236,0.8)",
        padding: isActive ? 10 : 9,
        opacity: isLocked ? 0.6 : 1,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isActive && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            backgroundColor: "#38bdf8",
          }}
        />
      )}

      <div className="flex items-center gap-2" style={{ paddingLeft: isActive ? 8 : 0 }}>
        <div
          className="flex flex-shrink-0 items-center justify-center rounded"
          style={{
            width: 32,
            height: 32,
            backgroundColor: isActive ? "#dcfce7" : round.status === "submitted" ? "#ffffff" : "transparent",
            border: round.status === "submitted" ? "1px solid rgba(223,226,236,0.8)" : isActive ? "1px solid #bec6e0" : "none",
          }}
        >
          {round.status === "submitted" && <CheckCircleIcon />}
          {isActive && <RocketIcon />}
          {isLocked && <LockIcon />}
        </div>
        <div className="flex flex-col">
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: isLocked ? "#8891a5" : "#0e1528",
              lineHeight: "25.2px",
            }}
          >
            {round.name}
          </span>
          {isActive && round.daysUntilDue !== null && (
            <div className="mt-1 flex items-center gap-1">
              <AlertIcon />
              <span style={{ fontSize: 12, color: "#ba1a1a", letterSpacing: "0.24px", lineHeight: "12px" }}>
                Due in {round.daysUntilDue} days
              </span>
            </div>
          )}
        </div>
      </div>

      {round.status === "submitted" && (
        <span
          className="rounded"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid rgba(223,226,236,0.8)",
            padding: "5px 9px",
            fontSize: 12,
            color: "#8891a5",
            letterSpacing: "0.24px",
            lineHeight: "12px",
          }}
        >
          Submitted
        </span>
      )}
      {isActive && (
        <span
          className="rounded"
          style={{
            backgroundColor: "rgba(223,226,236,0.8)",
            padding: "4px 8px",
            fontSize: 12,
            color: "#0e1528",
            letterSpacing: "0.24px",
            lineHeight: "12px",
          }}
        >
          Upload
        </span>
      )}
      {isLocked && (
        <span style={{ fontSize: 12, color: "#8891a5", letterSpacing: "0.24px", lineHeight: "12px" }}>
          Not Open
        </span>
      )}
    </div>
  );
}

export function TeamDetailTrack({ track, rounds }: TeamDetailTrackProps) {
  return (
    <div
      className="flex flex-col gap-4 rounded-lg"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid rgba(223,226,236,0.8)",
        padding: 25,
        filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.05))",
      }}
    >
      <div className="flex flex-col gap-1">
        <span
          style={{
            fontSize: 12,
            color: "#8891a5",
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            lineHeight: "12px",
          }}
        >
          HACKATHON TRACK
        </span>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#0e1528",
            letterSpacing: "-0.24px",
            lineHeight: "31.2px",
            paddingBottom: 5,
          }}
        >
          {track.fullName}
        </h2>
        {track.mentorName && (
          <span
            className="flex w-fit items-center gap-1 rounded"
            style={{
              backgroundColor: "#eef0f6",
              border: "1px solid rgba(223,226,236,0.8)",
              padding: "5px 9px",
              fontSize: 14,
              color: "#8891a5",
              lineHeight: "21px",
            }}
          >
            <MentorIcon />
            Mentor: {track.mentorName}
          </span>
        )}
      </div>

      <div style={{ borderTop: "1px solid rgba(223,226,236,0.8)", paddingTop: 17 }}>
        <span
          style={{
            fontSize: 12,
            color: "#8891a5",
            letterSpacing: "0.24px",
            lineHeight: "12px",
            display: "block",
            paddingBottom: 12,
          }}
        >
          Submission Status
        </span>
        <div className="flex flex-col gap-2">
          {rounds.map((round) => (
            <RoundRow key={round.id} round={round} />
          ))}
        </div>
      </div>
    </div>
  );
}
