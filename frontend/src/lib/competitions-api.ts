"use client";
/* ============================================================================
 * competitions-api.ts — gọi BACKEND THẬT cho phần Cuộc thi (Competition).
 * ----------------------------------------------------------------------------
 * Đây là "lát cắt mẫu": nó cho thấy cách thay localStorage bằng API thật.
 * Backend (Spring Boot) hiện chỉ phơi ra 5 trường qua /api/competitions:
 *     id, seasonId, name, description, status, startDate
 * (DB còn nhiều cột hơn — rounds, prizes, tiêu chí chấm... — nhưng lớp Java
 *  chưa expose, nên tạm thời chỉ đồng bộ 5 trường này lên server.)
 *
 * Muốn nối thêm tính năng khác (team, judging...) thì copy đúng khuôn này:
 *   định nghĩa kiểu dữ liệu → viết các hàm list/create/update/delete gọi apiX.
 * ========================================================================== */
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

// "Hình dạng" 1 cuộc thi đúng như backend trả về (chỉ 5 trường + id).
export interface BackendCompetition {
  id: number;
  seasonId: number | null;
  name: string;
  description: string | null;
  status: string | null;
  startDate: string | null; // ISO LocalDateTime, vd "2026-08-02T08:00:00"
}

// Body khi tạo/sửa (không có id — server tự sinh).
export interface CompetitionInput {
  seasonId?: number | null;
  name: string;
  description?: string | null;
  status?: string | null;
  startDate?: string | null;
}

// datetime-local của trình duyệt cho ra "2026-08-02T08:00" (thiếu giây).
// Spring LocalDateTime đọc được cả 2, nhưng ta thêm ":00" cho chắc chắn.
function normalizeDateTime(v?: string | null): string | null {
  if (!v) return null;
  return v.length === 16 ? `${v}:00` : v;
}

// GET  /api/competitions        → danh sách tất cả cuộc thi (từ DB).
export const listCompetitions = () => apiGet<BackendCompetition[]>("/api/competitions");

// GET  /api/competitions/{id}   → 1 cuộc thi.
export const getCompetition = (id: number) => apiGet<BackendCompetition>(`/api/competitions/${id}`);

// POST /api/competitions        → tạo mới, trả về cuộc thi vừa tạo (đã có id).
export const createCompetitionApi = (input: CompetitionInput) =>
  apiPost<BackendCompetition>("/api/competitions", {
    seasonId: input.seasonId ?? null,
    name: input.name,
    description: input.description ?? null,
    status: input.status ?? null,
    startDate: normalizeDateTime(input.startDate),
  });

// PUT  /api/competitions/{id}   → cập nhật.
export const updateCompetitionApi = (id: number, input: CompetitionInput) =>
  apiPut<BackendCompetition>(`/api/competitions/${id}`, {
    seasonId: input.seasonId ?? null,
    name: input.name,
    description: input.description ?? null,
    status: input.status ?? null,
    startDate: normalizeDateTime(input.startDate),
  });

// DELETE /api/competitions/{id} → xoá.
export const deleteCompetitionApi = (id: number) => apiDelete<string>(`/api/competitions/${id}`);
