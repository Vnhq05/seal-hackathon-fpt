/* ── Judge Portal types ── */

export type RoundStatus = "open" | "upcoming" | "closed";
export type SubmissionScoringStatus = "scored" | "unscored";
export type SubmissionFilterTab = "all" | "scored" | "unscored";

/* ── Dashboard ── */

export interface JudgeDashboardUrgency {
  message: string;
  remainingHours: number;
  remainingSubmissions: number;
  roundId: string;
}

export interface JudgeDashboardStats {
  roundsAssigned: number;
  totalSubmissions: number;
  scored: number;
  remaining: number;
}

export interface AssignedRoundCard {
  id: string;
  hackathonName: string;
  roundName: string;
  deadline: string;
  scored: number;
  total: number;
  status: RoundStatus;
}

export interface RecentScoringActivity {
  id: string;
  teamName: string;
  timeAgo: string;
  score: number;
  maxScore: number;
}

export interface JudgeDashboard {
  urgency: JudgeDashboardUrgency | null;
  stats: JudgeDashboardStats;
  assignedRounds: AssignedRoundCard[];
  recentActivity: RecentScoringActivity[];
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
  teamName: string;
  score: number | null;
  maxScore: number;
  status: SubmissionScoringStatus;
  submittedAt: string;
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
  maxScore: number;
}

export interface SubmissionLink {
  label: string;
  url: string;
  type: "github" | "demo" | "document" | "video" | "other";
}

export interface SubmissionForScoring {
  id: string;
  teamName: string;
  hackathonName: string;
  roundName: string;
  roundId: string;
  deadline: string;
  description: string;
  links: SubmissionLink[];
  criteria: ScoringCriterion[];
  existingScores: CriterionScore[] | null;
  isDraft: boolean;
}

/* ── Score submission ── */

export interface CriterionScore {
  criterionId: string;
  score: number;
  feedback: string;
}

export interface SubmitScoresPayload {
  submissionId: string;
  scores: CriterionScore[];
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
