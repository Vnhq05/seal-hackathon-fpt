import type { HackathonDetail } from "@/features/events/types/hackathon-detail.types";
import { HackathonRegistrationCard } from "@/features/events/components/hackathon-registration-card";
import { HackathonKeyDates } from "@/features/events/components/hackathon-key-dates";

interface HackathonDetailSidebarProps {
  hackathon: HackathonDetail;
}

export function HackathonDetailSidebar({ hackathon }: HackathonDetailSidebarProps) {
  return (
    <div className="flex flex-col gap-6">
      <HackathonRegistrationCard
        registration={hackathon.registration}
        hackathonId={hackathon.id}
      />
      <HackathonKeyDates dates={hackathon.keyDates} />
      <button
        type="button"
        className="flex items-center justify-center gap-2 rounded-lg"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid rgba(223,226,236,0.8)",
          padding: 17,
          filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.05))",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 500,
          color: "#0e1528",
          letterSpacing: "0.24px",
          lineHeight: "12px",
        }}
      >
        <svg width="15" height="12" viewBox="0 0 15 12" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="13" height="10" rx="2" stroke="#0e1528" strokeWidth="1.2" />
          <path d="M1 4l6.5 3.5L14 4" stroke="#0e1528" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Contact Organizers
      </button>
    </div>
  );
}
