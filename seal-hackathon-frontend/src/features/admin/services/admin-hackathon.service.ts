import { apiClient } from "@/lib/axios";
import type {
  AdminDashboardStats,
  AdminActiveEvent,
  AdminActivityEntry,
  AdminHackathonListResponse,
  AdminHackathon,
  CreateHackathonRequest,
  UpdateHackathonRequest,
  AdminRoundListResponse,
  AdminRound,
  CreateRoundRequest,
  UpdateRoundRequest,
  AdminTrackListResponse,
  AdminTrack,
  CreateTrackRequest,
  UpdateTrackRequest,
  MentorOption,
} from "@/features/admin/types/admin.types";

/* ── Dashboard ── */

export async function fetchAdminDashboard(): Promise<AdminDashboardStats> {
  const { data } = await apiClient.get<AdminDashboardStats>("/admin/dashboard");
  return data;
}

export async function fetchActiveEvents(): Promise<AdminActiveEvent[]> {
  const { data } = await apiClient.get<AdminActiveEvent[]>("/admin/dashboard/active-events");
  return data;
}

export async function fetchAdminActivity(): Promise<AdminActivityEntry[]> {
  const { data } = await apiClient.get<AdminActivityEntry[]>("/admin/dashboard/activity");
  return data;
}

/* ── Hackathons ── */

export async function fetchAdminHackathons(): Promise<AdminHackathonListResponse> {
  const { data } = await apiClient.get<AdminHackathonListResponse>("/admin/hackathons");
  return data;
}

export async function fetchAdminHackathon(id: string): Promise<AdminHackathon> {
  const { data } = await apiClient.get<AdminHackathon>(`/admin/hackathons/${id}`);
  return data;
}

export async function createHackathon(payload: CreateHackathonRequest): Promise<AdminHackathon> {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("description", payload.description);
  formData.append("startDate", payload.startDate);
  formData.append("endDate", payload.endDate);
  formData.append("format", payload.format);
  formData.append("minTeamSize", String(payload.minTeamSize));
  formData.append("maxTeamSize", String(payload.maxTeamSize));
  formData.append("prizePool", payload.prizePool);
  formData.append("registrationDeadline", payload.registrationDeadline);
  if (payload.banner) formData.append("banner", payload.banner);
  const { data } = await apiClient.post<AdminHackathon>("/admin/hackathons", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateHackathon(payload: UpdateHackathonRequest): Promise<AdminHackathon> {
  const { id, ...rest } = payload;
  const { data } = await apiClient.put<AdminHackathon>(`/admin/hackathons/${id}`, rest);
  return data;
}

export async function archiveHackathon(id: string): Promise<void> {
  await apiClient.patch(`/admin/hackathons/${id}/archive`);
}

/* ── Rounds ── */

export async function fetchAdminRounds(hackathonId?: string): Promise<AdminRoundListResponse> {
  const { data } = await apiClient.get<AdminRoundListResponse>("/admin/rounds", {
    params: hackathonId ? { hackathonId } : undefined,
  });
  return data;
}

export async function fetchAdminRound(id: string): Promise<AdminRound> {
  const { data } = await apiClient.get<AdminRound>(`/admin/rounds/${id}`);
  return data;
}

export async function createRound(payload: CreateRoundRequest): Promise<AdminRound> {
  const { data } = await apiClient.post<AdminRound>("/admin/rounds", payload);
  return data;
}

export async function updateRound(payload: UpdateRoundRequest): Promise<AdminRound> {
  const { id, ...rest } = payload;
  const { data } = await apiClient.put<AdminRound>(`/admin/rounds/${id}`, rest);
  return data;
}

export async function deleteRound(id: string): Promise<void> {
  await apiClient.delete(`/admin/rounds/${id}`);
}

/* ── Tracks ── */

export async function fetchAdminTracks(hackathonId?: string): Promise<AdminTrackListResponse> {
  const { data } = await apiClient.get<AdminTrackListResponse>("/admin/tracks", {
    params: hackathonId ? { hackathonId } : undefined,
  });
  return data;
}

export async function fetchAdminTrack(id: string): Promise<AdminTrack> {
  const { data } = await apiClient.get<AdminTrack>(`/admin/tracks/${id}`);
  return data;
}

export async function createTrack(payload: CreateTrackRequest): Promise<AdminTrack> {
  const { data } = await apiClient.post<AdminTrack>("/admin/tracks", payload);
  return data;
}

export async function updateTrack(payload: UpdateTrackRequest): Promise<AdminTrack> {
  const { id, ...rest } = payload;
  const { data } = await apiClient.put<AdminTrack>(`/admin/tracks/${id}`, rest);
  return data;
}

export async function deleteTrack(id: string): Promise<void> {
  await apiClient.delete(`/admin/tracks/${id}`);
}

/* ── Mentor options for track assignment ── */

export async function fetchMentorOptions(): Promise<MentorOption[]> {
  const { data } = await apiClient.get<MentorOption[]>("/admin/mentors/options");
  return data;
}
