import { useQuery } from "@tanstack/react-query";
import {
  fetchAdminDashboard,
  fetchActiveEvents,
  fetchAdminActivity,
} from "@/features/admin/services/admin-hackathon.service";

export const ADMIN_DASHBOARD_KEY = "admin-dashboard" as const;
export const ADMIN_ACTIVE_EVENTS_KEY = "admin-active-events" as const;
export const ADMIN_ACTIVITY_KEY = "admin-activity" as const;

export function useAdminDashboard() {
  return useQuery({
    queryKey: [ADMIN_DASHBOARD_KEY],
    queryFn: fetchAdminDashboard,
  });
}

export function useActiveEvents() {
  return useQuery({
    queryKey: [ADMIN_ACTIVE_EVENTS_KEY],
    queryFn: fetchActiveEvents,
  });
}

export function useAdminActivity() {
  return useQuery({
    queryKey: [ADMIN_ACTIVITY_KEY],
    queryFn: fetchAdminActivity,
  });
}
