import type { EventResponse } from "@/lib/api/event.api";
import type { EventStatus, StudentStanding } from "@/lib/api/types";

export interface ParticipationGateInput {
  registrationDeadline: string;
  status: EventStatus;
  semesterMin?: number | null;
  semesterMax?: number | null;
}

export interface UserEligibilityInput {
  studentStanding?: StudentStanding | null;
  semester?: number | null;
}

export function isRegistrationDeadlineOpen(deadline: string, now = Date.now()): boolean {
  const endOfDay = new Date(`${deadline.split("T")[0]}T23:59:59`).getTime();
  return now <= endOfDay;
}

export function canModifyTeamMembersByStatus(status: EventStatus): boolean {
  return status === "OPEN" || status === "UPCOMING";
}

export function deriveParticipationGate(
  event: ParticipationGateInput,
  now = Date.now(),
): {
  isRegistrationOpen: boolean;
  canModifyMembers: boolean;
  registrationClosedReason: string | null;
} {
  const isRegistrationOpen = isRegistrationDeadlineOpen(event.registrationDeadline, now);
  const canModifyMembers =
    isRegistrationOpen && canModifyTeamMembersByStatus(event.status);

  let registrationClosedReason: string | null = null;
  if (!isRegistrationOpen) {
    registrationClosedReason = "Registration deadline has passed";
  } else if (!canModifyTeamMembersByStatus(event.status)) {
    registrationClosedReason = "Team member changes are not allowed in the current event phase";
  }

  return { isRegistrationOpen, canModifyMembers, registrationClosedReason };
}

export function deriveEnrollmentEligibility(
  event: Pick<EventResponse, "semesterMin" | "semesterMax">,
  user: UserEligibilityInput,
): { eligible: boolean; reason: string | null } {
  if (user.studentStanding === "GRADUATED") {
    return { eligible: false, reason: "Graduated students are not eligible to participate" };
  }

  const { semesterMin, semesterMax } = event;
  if (semesterMin == null || semesterMax == null) {
    return { eligible: true, reason: null };
  }

  if (user.semester == null) {
    return {
      eligible: false,
      reason: `Semester information is required (semester ${semesterMin}–${semesterMax})`,
    };
  }

  if (user.semester < semesterMin || user.semester > semesterMax) {
    return {
      eligible: false,
      reason: `Your semester (${user.semester}) does not meet the requirement (semester ${semesterMin}–${semesterMax})`,
    };
  }

  return { eligible: true, reason: null };
}

export function resolveEventTeamSize(
  event: Pick<EventResponse, "minTeam" | "maxTeam">,
  systemMin = 3,
  systemMax = 5,
): { minTeam: number; maxTeam: number } {
  return {
    minTeam: event.minTeam ?? systemMin,
    maxTeam: event.maxTeam ?? systemMax,
  };
}
