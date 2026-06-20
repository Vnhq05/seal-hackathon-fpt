"use client";

import { use } from "react";
import { RoundFormPage } from "@/features/admin/components/round-form-page";

export default function EditRoundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RoundFormPage roundId={id} />;
}
