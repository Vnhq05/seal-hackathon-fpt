"use client";

import { EnrollmentManagementPage } from "@/features/admin/components/enrollment-management-page";

export function EnrollmentsTab({ eventId }: { eventId: string }) {
  return <EnrollmentManagementPage eventId={eventId} embedded />;
}
