export type NotificationType =
  | "team_invite"
  | "registration_update"
  | "submission_feedback"
  | "announcement"
  | "deadline_reminder"
  | "score_published";

export type NotificationTab =
  | "all"
  | "unread"
  | "events"
  | "team"
  | "results"
  | "system";

export interface NotificationAction {
  label: string;
  variant: "primary" | "danger" | "outline";
  actionUrl?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  actions?: NotificationAction[];
}

export interface NotificationListResponse {
  data: Notification[];
  total: number;
  unreadCount: number;
}

export interface NotificationStore {
  activeTab: NotificationTab;
  setActiveTab: (tab: NotificationTab) => void;
}
