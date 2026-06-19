import { apiClient } from "@/lib/axios";
import type { SystemConfig } from "@/features/admin/types/admin.types";
import type {
  ExportRequest,
  ExportPreviewResponse,
  JudgeVarianceResponse,
  CalibrationSessionListResponse,
  CreateCalibrationRequest,
  CalibrationDetailResponse,
  CalibrationSession,
  ResearchExportRequest,
} from "@/features/admin/types/admin-analytics.types";

/* ── System Config ── */

export async function fetchSystemConfig(): Promise<SystemConfig> {
  const { data } = await apiClient.get<SystemConfig>("/admin/system-config");
  return data;
}

export async function updateSystemConfig(payload: Partial<SystemConfig>): Promise<SystemConfig> {
  const { data } = await apiClient.put<SystemConfig>("/admin/system-config", payload);
  return data;
}

/* ── Export ── */

export async function fetchExportPreview(params: ExportRequest): Promise<ExportPreviewResponse> {
  const { data } = await apiClient.get<ExportPreviewResponse>("/admin/export/preview", { params });
  return data;
}

export async function downloadExport(params: ExportRequest): Promise<Blob> {
  const response = await apiClient.get("/admin/export/download", {
    params,
    responseType: "blob",
  });
  return response.data as Blob;
}

/* ── Judge Variance ── */

export async function fetchJudgeVariance(hackathonId?: string): Promise<JudgeVarianceResponse> {
  const { data } = await apiClient.get<JudgeVarianceResponse>("/admin/analytics/judge-variance", {
    params: hackathonId ? { hackathonId } : undefined,
  });
  return data;
}

/* ── Calibration ── */

export async function fetchCalibrationSessions(): Promise<CalibrationSessionListResponse> {
  const { data } = await apiClient.get<CalibrationSessionListResponse>(
    "/admin/analytics/calibration",
  );
  return data;
}

export async function createCalibrationSession(
  payload: CreateCalibrationRequest,
): Promise<CalibrationSession> {
  const { data } = await apiClient.post<CalibrationSession>(
    "/admin/analytics/calibration",
    payload,
  );
  return data;
}

export async function fetchCalibrationDetail(id: string): Promise<CalibrationDetailResponse> {
  const { data } = await apiClient.get<CalibrationDetailResponse>(
    `/admin/analytics/calibration/${id}`,
  );
  return data;
}

/* ── Research Export ── */

export async function downloadResearchExport(payload: ResearchExportRequest): Promise<Blob> {
  const response = await apiClient.post("/admin/export/research", payload, {
    responseType: "blob",
  });
  return response.data as Blob;
}
