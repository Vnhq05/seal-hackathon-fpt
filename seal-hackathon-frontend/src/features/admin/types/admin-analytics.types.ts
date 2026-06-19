/* ── Export types ── */

export type ExportDataType = "SUBMISSIONS" | "SCORES" | "TEAMS" | "USERS";
export type ExportFormat = "CSV" | "JSON" | "PDF";

export interface ExportRequest {
  hackathonId: string;
  dataType: ExportDataType;
  format: ExportFormat;
}

export interface ExportPreviewRow {
  [key: string]: string | number;
}

export interface ExportPreviewResponse {
  columns: string[];
  rows: ExportPreviewRow[];
  totalRows: number;
}

/* ── Judge Variance / Calibration ── */

export interface JudgeVarianceEntry {
  judgeName: string;
  judgeId: string;
  avgScore: number;
  stdDeviation: number;
  submissionsScored: number;
  isOutlier: boolean;
}

export interface JudgeVarianceResponse {
  entries: JudgeVarianceEntry[];
  interRaterReliability: number;
  averageVariance: number;
  chartData: { judgeName: string; avgScore: number; deviation: number }[];
}

export interface CalibrationSession {
  id: string;
  name: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  createdAt: string;
  judgeCount: number;
  sampleCount: number;
}

export interface CalibrationSessionListResponse {
  data: CalibrationSession[];
  total: number;
}

export interface CreateCalibrationRequest {
  name: string;
  roundId: string;
  judgeIds: string[];
  sampleSubmissionIds: string[];
}

export interface CalibrationScore {
  judgeName: string;
  submissionTitle: string;
  score: number;
  notes: string;
}

export interface CalibrationDetailResponse {
  session: CalibrationSession;
  scores: CalibrationScore[];
}

/* ── Research Export ── */

export interface ResearchField {
  key: string;
  label: string;
  selected: boolean;
}

export interface ResearchExportRequest {
  hackathonId: string;
  fields: string[];
  anonymize: boolean;
  removeEmails: boolean;
  hashNames: boolean;
}

/* ── Criteria Template ── */

export interface CriterionItem {
  id?: string;
  name: string;
  description: string;
  weight: number;
}

export interface CriteriaTemplate {
  id: string;
  name: string;
  criteria: CriterionItem[];
  usedIn: string[];
}

export interface CriteriaTemplateListResponse {
  data: CriteriaTemplate[];
  total: number;
}

export interface CreateCriteriaTemplateRequest {
  name: string;
  criteria: Omit<CriterionItem, "id">[];
}

export interface UpdateCriteriaTemplateRequest {
  id: string;
  name?: string;
  criteria?: Omit<CriterionItem, "id">[];
}

/* ── Event Criteria Config ── */

export interface EventCriteriaConfig {
  hackathonId: string;
  roundId: string;
  templateId: string;
  overrides: { criterionName: string; weight: number }[];
}

export interface SaveEventCriteriaRequest {
  hackathonId: string;
  roundId: string;
  templateId: string;
  overrides: { criterionName: string; weight: number }[];
}
