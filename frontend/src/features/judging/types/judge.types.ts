/* ── Judge Portal types ── */

export type RoundStatus = "open" | "upcoming" | "closed";
export type SubmissionScoringStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "LOCKED";
export type SubmissionFilterTab =
  | "all"
  | "unscored"
  | "draft"
  | "submitted"
  | "locked";

/* ── Dashboard ── */

export interface JudgeDashboardStats {
  roundsAssigned: number;
  totalSubmissions: number;
  scored: number;
  remaining: number;
}

/** Per-event suggestion shown on lecturer dashboard while scoring is incomplete. */
export interface ScoringEventSuggestion {
  eventId: string;
  eventName: string;
  roundId: string;
  roundName: string;
  remaining: number;
  total: number;
  deadline: string | null;
}

export interface AssignedRoundCard {
  id: string;
  hackathonName: string;
  roundName: string;
  deadline: string;
  scored: number;
  total: number;
  status: RoundStatus;
  eventId: string | null;
}

export interface JudgeDashboard {
  stats: JudgeDashboardStats;
  assignedRounds: AssignedRoundCard[];
  /** Events that still need scoring from this judge — empty when fully scored. */
  scoringSuggestions: ScoringEventSuggestion[];
}

/* ── Assigned Rounds ── */

export interface CriterionTag {
  name: string;
}

export interface AssignedRound {
  id: string;
  hackathonName: string;
  roundName: string;
  status: RoundStatus;
  deadline: string;
  criteria: CriterionTag[];
  scored: number;
  total: number;
}

export interface AssignedRoundsResponse {
  data: AssignedRound[];
}

/* ── Round Submissions ── */

export interface RoundSubmission {
  id: string;
  teamId: string;
  teamName: string;
  trackName: string | null;
  groupName: string | null;
  score: number | null;
  maxScore: number;
  status: SubmissionScoringStatus;
  submittedAt: string | null;
  scoringDeadline: string | null;
  scoringAllowed: boolean;
  scoringDeniedReason: string | null;
  conflictOfInterest: boolean;
}

export interface RoundSubmissionsParams {
  filter?: SubmissionFilterTab;
  page?: number;
  limit?: number;
}

export interface RoundSubmissionsResponse {
  data: RoundSubmission[];
  roundName: string;
  hackathonName: string;
  total: number;
  page: number;
  limit: number;
}

/* ── Submission for Scoring ── */

export interface ScoringCriterion {
  id: string;
  name: string;
  weight: number;
  description: string;
  minScore: number;
  maxScore: number;
}

export interface SubmissionLink {
  label: string;
  url: string;
  type: "github" | "demo" | "document" | "video" | "other";
}

export interface SubmissionForScoring {
  id: string;
  teamId: string;
  teamName: string;
  eventId: string | null;
  hackathonName: string;
  roundName: string;
  trackName: string | null;
  roundId: string;
  deadline: string;
  description: string;
  sourceCodeUrl: string | null;
  /** @deprecated Use sourceCodeUrl */
  githubUrl: string | null;
  demoUrl: string | null;
  slideUrl: string | null;
  pdfFileUrl: string | null;
  pdfFileName: string | null;
  links: SubmissionLink[];
  criteria: ScoringCriterion[];
  existingScores: CriterionScore[] | null;
  scoreStatus: string | null;
  judgeScoreId: string | null;
  isDraft: boolean;
  isLocked: boolean;
  isCompleted: boolean;
  conflictOfInterest: boolean;
  conflictReason: string | null;
  isAssigned: boolean;
  scoringAllowed: boolean;
  scoringDeniedReason: string | null;
}

/* ── Score submission ── */

export interface CriterionScore {
  criterionId: string;
  score: number;
  feedback: string;
}

export interface SubmitScoresResponse {
  message: string;
  totalWeightedScore: number;
}

/* ── Score History ── */

export interface ScoreHistoryEntry {
  id: string;
  teamName: string;
  hackathonName: string;
  roundId: string;
  roundName: string;
  totalWeightedScore: number;
  maxScore: number;
  scoredAt: string;
  criteriaBreakdown: {
    criterionName: string;
    score: number;
    maxScore: number;
    weight: number;
  }[];
}

export interface ScoreHistoryResponse {
  data: ScoreHistoryEntry[];
}
