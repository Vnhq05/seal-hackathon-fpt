import { api } from "./api-client";
import type { StudentStanding, UserType } from "./types";

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
  achievedAt: string | null;
}

export interface PublicMatchingProfileResponse {
  userId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  studentId: string | null;
  userType: UserType | null;
  universityName: string | null;
  studentStanding: StudentStanding | null;
  semester: number | null;
  temporaryAccount: boolean;
  createdAt: string | null;
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
    achievedAt: raw.achievedAt != null ? String(raw.achievedAt) : null,
  };
}

function normalizePublicProfile(raw: Record<string, unknown>): PublicMatchingProfileResponse {
  const competitions = Array.isArray(raw.competitions)
    ? raw.competitions.map((item) => normalizeCompetition(item as Record<string, unknown>))
    : [];

  return {
    userId: String(raw.userId),
    fullName: String(raw.fullName ?? ""),
    email: raw.email != null ? String(raw.email) : null,
    phone: raw.phone != null ? String(raw.phone) : null,
    avatarUrl: raw.avatarUrl != null ? String(raw.avatarUrl) : null,
    studentId: raw.studentId != null ? String(raw.studentId) : null,
    userType: raw.userType != null ? (String(raw.userType) as UserType) : null,
    universityName: raw.universityName != null ? String(raw.universityName) : null,
    studentStanding: raw.studentStanding != null ? (String(raw.studentStanding) as StudentStanding) : null,
    semester: raw.semester != null ? Number(raw.semester) : null,
    temporaryAccount: Boolean(raw.temporaryAccount),
    createdAt: raw.createdAt != null ? String(raw.createdAt) : null,
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
