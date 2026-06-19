import { apiClient } from "@/lib/axios";
import type {
  DashboardSummary,
  DashboardHackathon,
  DashboardTeam,
} from "@/features/dashboard/types/dashboard.types";

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await apiClient.get<DashboardSummary>("/dashboard/summary");
  return data;
}

export async function fetchDashboardHackathons(): Promise<DashboardHackathon[]> {
  const { data } = await apiClient.get<DashboardHackathon[]>("/dashboard/hackathons");
  return data;
}

export async function fetchDashboardTeam(): Promise<DashboardTeam | null> {
  const { data } = await apiClient.get<DashboardTeam | null>("/dashboard/team");
  return data;
}
