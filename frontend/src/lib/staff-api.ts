"use client";
/* ============================================================================
 * staff-api.ts — roster Judge & Mentor của từng cuộc thi (màn hình Judge/Mentor
 * assignment cho Admin). Gọi BACKEND THẬT.
 * ----------------------------------------------------------------------------
 * Endpoints (xem CompetitionStaffController.java):
 *   GET    /api/judges                                   → tất cả judge (để search)
 *   GET    /api/mentors                                  → tất cả mentor (để search)
 *   GET    /api/competitions/{id}/judges                 → judge của cuộc thi
 *   POST   /api/competitions/{id}/judges/{judgeId}       → thêm judge vào cuộc thi
 *   DELETE /api/competitions/{id}/judges/{judgeId}       → gỡ judge khỏi cuộc thi
 *   GET    /api/competitions/{id}/mentors                → mentor của cuộc thi
 *   POST   /api/competitions/{id}/mentors/{mentorId}     → thêm mentor vào cuộc thi
 *   DELETE /api/competitions/{id}/mentors/{mentorId}     → gỡ mentor khỏi cuộc thi
 * ========================================================================== */
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import type { Mentor } from "@/lib/mentor-api";

export type { Mentor };

export interface Judge {
  id: number;
  userId: number | null;
  fullName: string;
  isGuest: boolean;
  email?: string | null;
}

// --- Pool để search ---
export const listAllJudgesApi = () => apiGet<Judge[]>("/api/judges");
export const listAllMentorsApi = () => apiGet<Mentor[]>("/api/mentors");

// --- Judge roster của cuộc thi ---
export const listCompetitionJudgesApi = (competitionId: number) =>
  apiGet<Judge[]>(`/api/competitions/${competitionId}/judges`);

export const addCompetitionJudgeApi = (competitionId: number, judgeId: number) =>
  apiPost<string>(`/api/competitions/${competitionId}/judges/${judgeId}`);

export const removeCompetitionJudgeApi = (competitionId: number, judgeId: number) =>
  apiDelete<string>(`/api/competitions/${competitionId}/judges/${judgeId}`);

// --- Mentor roster của cuộc thi ---
export const listCompetitionMentorsApi = (competitionId: number) =>
  apiGet<Mentor[]>(`/api/competitions/${competitionId}/mentors`);

export const addCompetitionMentorApi = (competitionId: number, mentorId: number) =>
  apiPost<string>(`/api/competitions/${competitionId}/mentors/${mentorId}`);

export const removeCompetitionMentorApi = (competitionId: number, mentorId: number) =>
  apiDelete<string>(`/api/competitions/${competitionId}/mentors/${mentorId}`);
