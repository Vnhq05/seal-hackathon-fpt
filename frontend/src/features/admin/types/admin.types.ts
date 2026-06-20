/* ── Admin core types ── */

import type { EventStatus } from "@/lib/api/types";

export interface AdminDashboardStats {
  totalEvents: number;
  pendingApprovals: number;
  /* Fields below are not returned by the backend; components treat them as optional. */
  totalHackathons?: number;
  activeUsers?: number;
  totalSubmissions?: number;
  activityTrend?: { date: string; count: number }[];
  activeEvents?: number;
  totalTeams?: number;
  totalEventsTrend?: number;
  activeUsersTrend?: number;
  totalTeamsTrend?: number;
  totalSubmissionsTrend?: number;
  systemOperational?: boolean;
}

/**
 * Replaces old AdminActiveEvent.
 * Now derived from EventResponse (which has no participants/staffAvatars/round fields).
 */
export interface AdminActiveEvent {
  id: string;
  name: string;
  status: EventStatus;
  season: string;
  year: number;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  roundCount: number;
  mentorCount: number;
  createdAt: string;
}

/**
 * Activity feed entries are now derived from AuditLogResponse.
 */
export interface AdminActivityEntry {
  id: string;
  action: string;
  actorId: string;
  targetId: string | null;
  targetType: string | null;
  timestamp: string;
}

/* ── Hackathon / Event CRUD ── */

export type HackathonStatus = EventStatus;

/**
 * AdminHackathon is now identical to EventResponse.
 * Old fields (description, format, minTeamSize, maxTeamSize, prizePool, bannerUrl, teamsCount)
 * no longer exist in the backend.
 */
export interface AdminHackathon {
  id: string;
  name: string;
  status: EventStatus;
  startDate: string;
  endDate: string;
  season: string;
  year: number;
  registrationDeadline: string;
  roundCount: number;
  mentorCount: number;
  createdAt: string;
}

/* ── Rounds ── */

/**
 * RoundResponse from the backend. No description, type, hackathonId fields.
 */
export interface AdminRound {
  id: string;
  eventId: string;
  roundNumber: number;
  name: string;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  scoringDeadline: string;
  advancementCutoff: number;
  criteria: { id: string; name: string; description: string | null; weight: number; sortOrder: number }[];
  judgeCount: number;
}

/* ── Tracks (deprecated - no backend support) ── */

export type TrackStatus = "OPEN" | "CLOSED";

export interface AdminTrack {
  id: string;
  name: string;
  description: string;
}

/* ── System Config (placeholder - no backend support) ── */

export interface SystemConfig {
  platformName: string;
  registrationOpen: boolean;
  maxTeamSize: number;
  emailTemplateWelcome: string;
  emailTemplateSubmission: string;
  featureFlagLeaderboard: boolean;
  featureFlagMentorPortal: boolean;
  featureFlagJudgePortal: boolean;
}

/* ── Mentor dropdown ── */

export interface MentorOption {
  id: string;
  name: string;
  email: string;
}
