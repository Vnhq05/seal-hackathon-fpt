"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EnrollmentsRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/admin/hackathons/${eventId}?tab=enrollments`);
  }, [eventId, router]);

  return (
    <div style={{ padding: 24 }}>
      <p style={{ fontSize: 14, color: "#8891a5" }}>Redirecting to enrollments...</p>
    </div>
  );
}
