// ═══════════════════════════════════════════════════
//  Shared types aligned to backend domain model
// ═══════════════════════════════════════════════════

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export type UserType =
  | "FPT_STUDENT"
  | "EXTERNAL_STUDENT"
  | "LECTURER"
  | "EVENT_COORDINATOR"
  | "SYSTEM_ADMIN";

export type AccountStatus = "PENDING" | "ACTIVE" | "REJECTED" | "LOCKED";

export type EventStatus =
  | "UPCOMING"
  | "OPEN"
  | "CLOSED_REGISTRATION"
  | "ACTIVE"
  | "SCORING"
  | "COMPLETED"
  | "CANCELLED";

export type CompetitionFormat = "GENERIC" | "SEAL_RAG_2026";

export type RoundType = "PRELIMINARY" | "FINAL";

export type TeamStatus = "FORMING" | "CONFIRMED" | "DISBANDED";

export type TeamMemberRole = "LEADER" | "MEMBER";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELLED";

export type SubmissionStatus = "DRAFT" | "SUBMITTED" | "SCORED" | "NOT_SCORED";

export type AdvancementStatus = "ADVANCED" | "ELIMINATED" | "PENDING";

export type DisputeStatus = "OPEN" | "RESOLVED" | "REJECTED";

export interface PageParams {
  page?: number;
  size?: number;
  sort?: string;
}
