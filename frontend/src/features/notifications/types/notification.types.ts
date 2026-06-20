// Re-export canonical types from lib/api and hooks
// Old types (Notification, NotificationListResponse, NotificationStore) are replaced.
// Import from @/lib/api or the hooks instead.

export type { NotificationType, NotificationResponse as Notification } from "@/lib/api";
export type { NotificationTab } from "@/features/notifications/hooks/use-notifications";
