"use client";
/* ============================================================================
 * submission-api.ts — gọi BACKEND THẬT cho phần Nộp bài (Submission).
 * Endpoints (xem SubmissionController.java):
 *   POST /api/submissions              → Leader nộp/ cập nhật bài cho 1 vòng
 *   GET  /api/submissions/team/{teamId}→ các bài đã nộp của team
 * ========================================================================== */
import { apiGet, apiPost } from "@/lib/api";

export interface Submission {
  id: number;
  teamId: number;
  roundId: number;
  githubUrl?: string | null;
  videoUrl?: string | null;
  pdfUrl?: string | null;
  notes?: string | null;
  status?: string | null; // Draft / Under Review / Submitted
  submittedAt?: string | null;
  updatedAt?: string | null;
}

export interface SubmitWorkInput {
  teamId: number;
  roundId: number;
  githubUrl?: string;
  videoUrl?: string;
  pdfUrl?: string;
  notes?: string;
}

export const submitWorkApi = (input: SubmitWorkInput) =>
  apiPost<Submission>("/api/submissions", input);

export const getTeamSubmissionsApi = (teamId: number) =>
  apiGet<Submission[]>(`/api/submissions/team/${teamId}`);
