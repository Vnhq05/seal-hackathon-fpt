import { useQuery } from "@tanstack/react-query";
import {
  eventApi,
  adminUserApi,
  auditApi,
  type EventResponse,
  type EventListParams,
  type AuditLogResponse,
  type Page,
} from "@/lib/api";

export const ADMIN_DASHBOARD_KEY = "admin-dashboard" as const;
export const ADMIN_ACTIVE_EVENTS_KEY = "admin-active-events" as const;
export const ADMIN_ACTIVITY_KEY = "admin-activity" as const;

/**
 * Dashboard stats composed from available endpoints.
 *
 * The old `/admin/dashboard` endpoint does not exist. Instead we fetch:
 * - eventApi.list() for total / active event counts
 * - adminUserApi.countPending() for pending approval count
 */
export function useAdminDashboard() {
  return useQuery({
    queryKey: [ADMIN_DASHBOARD_KEY],
    queryFn: async () => {
      const [eventsPage, pendingCount] = await Promise.all([
        eventApi.list({ size: 1 }),
        adminUserApi.countPending(),
      ]);

      return {
        totalEvents: eventsPage.totalElements,
        pendingApprovals: pendingCount,
      };
    },
  });
}

/** List active & upcoming events for the dashboard table. */
export function useActiveEvents() {
  return useQuery({
    queryKey: [ADMIN_ACTIVE_EVENTS_KEY],
    queryFn: () => eventApi.list({ size: 10 }),
  });
}

/**
 * Recent admin activity.
 *
 * The old `/admin/dashboard/activity` endpoint does not exist.
 * We use the audit log as a proxy for recent activity.
 */
export function useAdminActivity() {
  return useQuery({
    queryKey: [ADMIN_ACTIVITY_KEY],
    queryFn: () => auditApi.list({ size: 20, sort: "timestamp,desc" }),
  });
}
