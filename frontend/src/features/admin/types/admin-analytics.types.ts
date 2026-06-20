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

/* ── Judge Variance / Calibration (stub - no backend support) ── */

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

export interface CreateCalibrationRequest {
  name: string;
  roundId: string;
  judgeIds: string[];
  sampleSubmissionIds: string[];
}

/* ── Research Export ── */

export interface ResearchField {
  key: string;
  label: string;
  selected: boolean;
}

/* ── Criteria Template (stub - no backend support) ── */

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
