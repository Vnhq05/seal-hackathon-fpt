"use client";

import { useMemo } from "react";
import type { EventResponse } from "@/lib/api/event.api";
import { deriveParticipationGate } from "@/features/events/utils/participation-gate.utils";

/**
 * Gate for invitation accept flows. InvitationResponse has no eventId;
 * pass the resolved event from active enrollment or parent context.
 */
export function useInvitationParticipationGate(event: EventResponse | null | undefined) {
  return useMemo(() => {
    if (!event) {
      return {
        canModifyMembers: false,
        registrationClosedReason: "Event not loaded" as string | null,
      };
    }
    const gate = deriveParticipationGate(event);
    return {
      canModifyMembers: gate.canModifyMembers,
      registrationClosedReason: gate.registrationClosedReason,
    };
  }, [event]);
}
