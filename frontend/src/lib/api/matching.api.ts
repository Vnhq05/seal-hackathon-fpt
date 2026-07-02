import { api } from "./api-client";
import type { UserType } from "./types";

export type CompetitionOutcome = "CHAMPION" | "FINALIST" | "ELIMINATED" | "UNRANKED";

export interface MatchingCandidateResponse {
  userId: string;
  fullName: string;
  userType: UserType | null;
  universityName: string | null;
  semester: number | null;
  preferredRole: string | null;
  isProfilePublic: boolean;
  hasPendingInvitation: boolean;
}

export interface CompetitionHistoryItem {
  eventId: string;
  eventName: string;
  season: string;
  year: number;
  teamName: string;
  finalRank: number | null;
  outcome: CompetitionOutcome;
}

export interface PublicMatchingProfileResponse {
  userId: string;
  fullName: string;
  userType: UserType | null;
  universityName: string | null;
  semester: number | null;
  competitions: CompetitionHistoryItem[];
}

function normalizeCandidate(raw: Record<string, unknown>): MatchingCandidateResponse {
  return {
    userId: String(raw.userId),
    fullName: String(raw.fullName ?? ""),
    userType: raw.userType != null ? (String(raw.userType) as UserType) : null,
    universityName: raw.universityName != null ? String(raw.universityName) : null,
    semester: raw.semester != null ? Number(raw.semester) : null,
    preferredRole: raw.preferredRole != null ? String(raw.preferredRole) : null,
    isProfilePublic: Boolean(raw.isProfilePublic ?? raw.profilePublic),
    hasPendingInvitation: Boolean(raw.hasPendingInvitation ?? raw.pendingInvitation),
  };
}

function normalizeCompetition(raw: Record<string, unknown>): CompetitionHistoryItem {
  return {
    eventId: String(raw.eventId),
    eventName: String(raw.eventName ?? ""),
    season: String(raw.season ?? ""),
    year: Number(raw.year),
    teamName: String(raw.teamName ?? ""),
    finalRank: raw.finalRank != null ? Number(raw.finalRank) : null,
    outcome: String(raw.outcome) as CompetitionOutcome,
  };
}

function normalizePublicProfile(raw: Record<string, unknown>): PublicMatchingProfileResponse {
  const competitions = Array.isArray(raw.competitions)
    ? raw.competitions.map((item) => normalizeCompetition(item as Record<string, unknown>))
    : [];

  return {
    userId: String(raw.userId),
    fullName: String(raw.fullName ?? ""),
    userType: raw.userType != null ? (String(raw.userType) as UserType) : null,
    universityName: raw.universityName != null ? String(raw.universityName) : null,
    semester: raw.semester != null ? Number(raw.semester) : null,
    competitions,
  };
}

export const matchingApi = {
  getCandidates(eventId: string, teamId: string): Promise<MatchingCandidateResponse[]> {
    return api
      .get<Record<string, unknown>[]>(`/events/${eventId}/teams/${teamId}/matching/candidates`)
      .then((rows) => rows.map(normalizeCandidate));
  },

  getPublicProfile(
    eventId: string,
    teamId: string,
    userId: string,
  ): Promise<PublicMatchingProfileResponse> {
    return api
      .get<Record<string, unknown>>(
        `/events/${eventId}/teams/${teamId}/matching/candidates/${userId}/profile`,
      )
      .then(normalizePublicProfile);
  },
};
