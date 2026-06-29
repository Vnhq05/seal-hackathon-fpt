"use client";

import { useMemo } from "react";
import type { EventResponse } from "@/lib/api/event.api";
import {
  deriveEnrollmentEligibility,
  deriveParticipationGate,
  type UserEligibilityInput,
} from "@/features/events/utils/participation-gate.utils";

export function useEventParticipationGate(
  event: EventResponse | null | undefined,
  user?: UserEligibilityInput | null,
) {
  return useMemo(() => {
    if (!event) {
      return {
        isRegistrationOpen: false,
        canModifyMembers: false,
        canEnroll: false,
        registrationClosedReason: "Event not loaded",
        enrollmentBlockReason: null as string | null,
      };
    }

    const gate = deriveParticipationGate(event);
    const enrollment = user
      ? deriveEnrollmentEligibility(event, user)
      : { eligible: true, reason: null as string | null };

    return {
      ...gate,
      canEnroll: gate.isRegistrationOpen && enrollment.eligible,
      enrollmentBlockReason: enrollment.reason,
    };
  }, [event, user]);
}
