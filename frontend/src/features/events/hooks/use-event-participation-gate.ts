"use client";

import { useMemo } from "react";
import type { EventResponse } from "@/lib/api/event.api";
import {
  deriveEnrollmentEligibility,
  deriveParticipationGate,
  type SemesterEligibilityRange,
  type UserEligibilityInput,
} from "@/features/events/utils/participation-gate.utils";
import { useSystemTeamConfig } from "@/features/teams/hooks/use-system-team-config";

export function useEventParticipationGate(
  event: EventResponse | null | undefined,
  user?: UserEligibilityInput | null,
  semesterRangeOverride?: SemesterEligibilityRange | null,
) {
  const { data: systemConfig } = useSystemTeamConfig();

  const semesterRange = useMemo<SemesterEligibilityRange>(
    () =>
      semesterRangeOverride ?? {
        semesterMin: systemConfig?.semesterMin,
        semesterMax: systemConfig?.semesterMax,
      },
    [semesterRangeOverride, systemConfig?.semesterMin, systemConfig?.semesterMax],
  );

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
      ? deriveEnrollmentEligibility(semesterRange, user)
      : { eligible: true, reason: null as string | null };

    return {
      ...gate,
      canEnroll: gate.isRegistrationOpen && enrollment.eligible,
      enrollmentBlockReason: enrollment.reason,
    };
  }, [event, user, semesterRange]);
}
