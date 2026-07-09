import type { TeamProgressResponse } from "@/lib/api/progress.api";

export interface AtRiskTeamEntry extends TeamProgressResponse {
  submissionDeadline: string;
}

export interface EventAtRiskGroup {
  eventId: string;
  eventName: string;
  teams: AtRiskTeamEntry[];
}

export type TeamsNeedingSupportScope = "staff" | "mentor";
