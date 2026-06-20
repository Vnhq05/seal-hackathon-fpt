export interface SubmissionSubmitter {
  name: string;
  team: string;
  avatarUrl: string | null;
  submittedAt: string;
}

export interface SubmissionArtifact {
  id: string;
  type: "repository" | "demo" | "presentation";
  title: string;
  subtitle: string;
  url: string;
}

export interface SubmissionVideo {
  thumbnailUrl: string | null;
  videoUrl: string | null;
}

export interface RepoInsights {
  commits: number;
  prsMerged: number;
  primaryLanguage: string;
  contributors: number;
  lastUpdate: string;
}

export interface CriterionScore {
  id: string;
  name: string;
  score: number;
  maxScore: number;
}

export interface JudgeFeedback {
  id: string;
  quote: string;
  author: string;
}

export interface SubmissionEvaluation {
  totalScore: number;
  maxTotalScore: number;
  criteria: CriterionScore[];
  feedback: JudgeFeedback[];
}

export interface SubmissionDetail {
  id: string;
  displayId: string;
  projectName: string;
  description: string;
  status: string;
  round: string;
  submitter: SubmissionSubmitter;
  artifacts: SubmissionArtifact[];
  video: SubmissionVideo;
  repoInsights: RepoInsights | null;
  techStack: string[];
  evaluation: SubmissionEvaluation | null;
}

export interface SubmissionDetailResponse {
  data: SubmissionDetail;
}
