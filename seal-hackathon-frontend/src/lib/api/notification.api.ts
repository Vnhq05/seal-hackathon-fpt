import { api } from "./api-client";
import type { Page, PageParams } from "./types";

// ═══ Types ═══

export type NotificationType =
  | "ACCOUNT_APPROVED" | "ACCOUNT_REJECTED" | "INTERNAL_ACCOUNT_CREATED"
  | "TEAM_REGISTERED" | "TEAM_CONFIRMED" | "INVITATION_RECEIVED"
  | "MENTOR_TEAM_ASSIGNED" | "SUBMISSION_CREATED"
  | "JUDGE_ASSIGNED" | "MENTOR_ASSIGNED" | "SCORING_REOPENED"
  | "RESULTS_PUBLISHED" | "DISPUTE_FILED";

export interface NotificationResponse {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: string | null;
  referenceType: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

// ═══ API calls ═══

export const notificationApi = {
  getAll(params?: PageParams): Promise<Page<NotificationResponse>> {
    return api.get<Page<NotificationResponse>>("/notifications", { params });
  },

  getUnread(params?: PageParams): Promise<Page<NotificationResponse>> {
    return api.get<Page<NotificationResponse>>("/notifications/unread", { params });
  },

  countUnread(): Promise<number> {
    return api.get<number>("/notifications/unread/count");
  },

  markAsRead(recipientId: string): Promise<void> {
    return api.put<void>(`/notifications/${recipientId}/read`);
  },

  markAllAsRead(): Promise<number> {
    return api.put<number>("/notifications/read-all");
  },
};
