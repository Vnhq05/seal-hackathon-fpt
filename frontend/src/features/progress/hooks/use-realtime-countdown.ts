"use client";

import { useEffect, useState } from "react";
import { msUntil } from "@/features/submissions/utils/seal-submission.utils";

export function useRealtimeCountdown(deadlineIso?: string | null): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!deadlineIso) return null;
  return msUntil(deadlineIso, now);
}
