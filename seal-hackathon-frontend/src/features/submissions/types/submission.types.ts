export type SubmissionStatus = "draft" | "submitted" | "reviewed";

export interface Submission {
  id: string;
  projectName: string;
  hackathonId: string;
  hackathonName: string;
  submittedAt: string | null;
  status: SubmissionStatus;
  score: number | null;
  feedbackSummary: string | null;
}

export interface SubmissionsResponse {
  data: Submission[];
  total: number;
}

export type PipelineRoundStatus = "submitted" | "not_submitted" | "not_open";

export interface RoundDeliverable {
  id: string;
  label: string;
  isCompleted: boolean;
}

export interface PipelineRound {
  id: string;
  roundNumber: number;
  name: string;
  description: string;
  status: PipelineRoundStatus;
  dueDate: string | null;
  timeRemaining: string | null;
  submittedAt: string | null;
  isScored: boolean;
  scoreResultUrl: string | null;
  deliverables: RoundDeliverable[];
  lockedMessage: string | null;
}

export interface SubmissionPipeline {
  teamId: string;
  teamName: string;
  hackathonName: string;
  rounds: PipelineRound[];
  lastUpdatedAt: string;
}
