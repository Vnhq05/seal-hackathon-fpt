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
        className="flex items-center justify-center gap-2 border-2 border-navy bg-white px-6 py-2.5 text-sm font-medium text-navy cursor-pointer"
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
