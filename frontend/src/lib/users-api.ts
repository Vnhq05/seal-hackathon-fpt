"use client";
/* ============================================================================
 * users-api.ts — gọi BACKEND THẬT cho phần Người dùng (User).
 * ----------------------------------------------------------------------------
 * Thay cho dữ liệu mock trong auth.tsx (SEED_USERS) ở 3 trang:
 *   - Users Management   (list + suspend/reactivate)
 *   - Account Approval   (list pending + approve)
 *   - Create Staff       (tạo Mentor/Judge/Lecturer/Coordinator)
 *
 * Endpoint backend (xem UserController.java):
 *   GET  /api/users               → danh sách user
 *   POST /api/users               → tạo nhân sự
 *   PUT  /api/users/{id}/status   → đổi trạng thái (active/pending/suspended)
 * ========================================================================== */
import { apiGet, apiPost, apiPut } from "@/lib/api";

export type UserRole = "Participant" | "Judge" | "Mentor" | "Lecturer" | "Coordinator" | "Admin";
export type UserStatus = "pending" | "active" | "suspended";

// "Hình dạng" 1 user đúng như backend trả về (đã cắt mật khẩu).
export interface BackendUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  studentId: string | null;
  school: string | null;
}

// Body khi Admin tạo tài khoản nhân sự.
export interface CreateStaffInput {
  name: string;
  email: string;
  role: "Mentor" | "Judge" | "Lecturer" | "Coordinator";
  password: string;
}

// GET /api/users → danh sách tất cả user.
export const listUsers = () => apiGet<BackendUser[]>("/api/users");

// POST /api/users → tạo nhân sự, trả về user vừa tạo.
export const createStaffApi = (input: CreateStaffInput) =>
  apiPost<BackendUser>("/api/users", input);

// PUT /api/users/{id}/status → đổi trạng thái tài khoản.
export const updateUserStatusApi = (id: number, status: UserStatus) =>
  apiPut<BackendUser>(`/api/users/${id}/status`, { status });
