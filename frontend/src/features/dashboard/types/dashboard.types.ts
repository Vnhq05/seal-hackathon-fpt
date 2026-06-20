// Re-export canonical types from lib/api
// Old types (DashboardSummary, DashboardHackathon, DashboardTeam) are replaced
// by API-aligned types. Import from @/lib/api instead.

export type { EventStatus as HackathonStatus } from "@/lib/api";
export type { SubmissionStatus } from "@/lib/api";
export type { EventResponse as DashboardHackathon } from "@/lib/api";
export type { TeamResponse as DashboardTeam } from "@/lib/api";
