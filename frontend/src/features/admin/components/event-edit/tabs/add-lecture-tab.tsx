"use client";

import { EventStaffSection } from "@/features/admin/components/event-edit/tabs/event-staff-section";

export function AddLectureTab({ eventId }: { eventId: string }) {
  return <EventStaffSection eventId={eventId} />;
}
