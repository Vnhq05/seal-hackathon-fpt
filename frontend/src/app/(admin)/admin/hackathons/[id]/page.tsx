"use client";

import { use } from "react";
import { EventEditDashboard } from "@/features/admin/components/event-edit/event-edit-dashboard";

export default function EditHackathonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <EventEditDashboard eventId={id} />;
}
