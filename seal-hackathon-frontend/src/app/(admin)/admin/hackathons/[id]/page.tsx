"use client";

import { use } from "react";
import { HackathonFormPage } from "@/features/admin/components/hackathon-form-page";

export default function EditHackathonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <HackathonFormPage hackathonId={id} />;
}
