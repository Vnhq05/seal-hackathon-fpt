"use client";
/* ============================================================================
 * notifications-api.ts — gọi BACKEND THẬT cho phần Thông báo (Notification).
 * ----------------------------------------------------------------------------
 * Thay cho dữ liệu mock (SEED_NOTIFICATIONS trong judging-store.ts) ở trang
 * Notifications.
 *
 * Endpoint backend (xem NotificationController.java):
 *   GET  /api/notifications/me   → thông báo của user đang đăng nhập (+ broadcast)
 *   POST /api/notifications      → tạo thông báo mới
 *
 * Lưu ý: backend hiện hardcode userId = 1 cho /me (TODO: lấy từ JWT). Khi
 * backend gắn Spring Security context, frontend không phải đổi gì ở đây.
 * ========================================================================== */
import { apiGet, apiPost } from "@/lib/api";

// "Hình dạng" 1 thông báo đúng như backend trả về (entity Notification).
export interface BackendNotification {
  id: number;
  userId: number | null; // null = broadcast cho tất cả
  title: string;
  body: string | null;
  type: string; // "info" | "warning" | "success" | ...
  isRead: boolean | null;
  createdAt: string | null; // ISO LocalDateTime, vd "2026-06-01T08:00:00"
}

// Body khi tạo thông báo (id/createdAt do server tự sinh).
export interface CreateNotificationInput {
  userId?: number | null;
  title: string;
  body?: string | null;
  type: string;
}

// GET /api/notifications/me → thông báo của user hiện tại.
export const listMyNotifications = () =>
  apiGet<BackendNotification[]>("/api/notifications/me");

// POST /api/notifications → tạo thông báo, trả về bản vừa tạo.
export const createNotificationApi = (input: CreateNotificationInput) =>
  apiPost<BackendNotification>("/api/notifications", {
    userId: input.userId ?? null,
    title: input.title,
    body: input.body ?? null,
    type: input.type,
    isRead: false,
  });
