"use client";

import { use } from "react";
import { TrackFormPage } from "@/features/admin/components/track-form-page";

export default function EditTrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TrackFormPage trackId={id} />;
}
