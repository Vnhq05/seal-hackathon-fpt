import { api } from "./api-client";
import { apiClient } from "@/lib/axios";
import type { ApiResponse, SubmissionStatus } from "./types";

/** Max PDF upload size for non-SEAL submissions (5 MB). */
export const SUBMISSION_MAX_PDF_BYTES = 5 * 1024 * 1024;

/** Normalize backend file path for apiClient (base URL already includes `/api`). */
export function normalizeSubmissionFilePath(fileUrl: string): string {
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    const path = new URL(fileUrl).pathname;
    return path.startsWith("/api/") ? path.slice(4) : path;
  }
  if (fileUrl.startsWith("/api/")) return fileUrl.slice(4);
  return fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
}

// ═══ Types ═══

export interface AttachmentResponse {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  pageCount: number;
}

export interface SubmissionVersionResponse {
  id: string;
  versionNumber: number;
  /** Canonical source code URL */
  sourceCodeUrl?: string | null;
  slideUrl?: string | null;
  demoUrl?: string | null;
  /** @deprecated Use sourceCodeUrl — backend alias for backward compatibility */
  githubUrl?: string | null;
  submittedAt: string;
  attachments: AttachmentResponse[];
}

export interface SubmissionResponse {
  id: string;
  teamId: string;
  roundId: string;
  status: SubmissionStatus;
  submittedBy: string;
  currentVersion: number;
  totalVersions: number;
  latestVersion: SubmissionVersionResponse | null;
  createdAt: string;
}

export interface CreateSubmissionRequest {
  /** Canonical source code URL (GitHub, Jira, Confluence, Notion) */
  sourceCodeUrl?: string;
  slideUrl?: string;
  demoUrl?: string;
  /** @deprecated Use sourceCodeUrl — still accepted by backend */
  githubUrl?: string;
  /** Legacy non-SEAL PDF upload metadata */
  pdfPageCount?: number;
}

// ═══ API calls ═══

export const submissionApi = {
  async submit(
    roundId: string,
    request: CreateSubmissionRequest,
    pdfFile?: File | null,
  ): Promise<SubmissionResponse> {
    const formData = new FormData();
    formData.append(
      "submission",
      new Blob([JSON.stringify(request)], { type: "application/json" }),
    );
    if (pdfFile) {
      formData.append("pdf", pdfFile);
    }

    const { data: wrapper } = await apiClient.post<ApiResponse<SubmissionResponse>>(
      `/rounds/${roundId}/submissions`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    if (!wrapper.success) {
      throw new Error(wrapper.message);
    }
    return wrapper.data;
  },

  async getByTeamOptional(roundId: string, teamId: string): Promise<SubmissionResponse | null> {
    try {
      return await this.getByTeam(roundId, teamId);
    } catch {
      return null;
    }
  },

  list(roundId: string): Promise<SubmissionResponse[]> {
    return api.get<SubmissionResponse[]>(`/rounds/${roundId}/submissions`);
  },

  getById(roundId: string, submissionId: string): Promise<SubmissionResponse> {
    return api.get<SubmissionResponse>(`/rounds/${roundId}/submissions/${submissionId}`);
  },

  getByTeam(roundId: string, teamId: string): Promise<SubmissionResponse> {
    return api.get<SubmissionResponse>(`/rounds/${roundId}/submissions/team/${teamId}`);
  },

  getVersionHistory(roundId: string, submissionId: string): Promise<SubmissionVersionResponse[]> {
    return api.get<SubmissionVersionResponse[]>(
      `/rounds/${roundId}/submissions/${submissionId}/versions`,
    );
  },

  getMentorSubmissions(roundId: string, eventId: string): Promise<SubmissionResponse[]> {
    return api.get<SubmissionResponse[]>(`/rounds/${roundId}/submissions/mentor`, {
      params: { eventId },
    });
  },

  /** GET /api/files/submissions/** — download PDF attachment (inline). */
  async downloadAttachment(fileUrl: string): Promise<Blob> {
    const { data } = await apiClient.get(normalizeSubmissionFilePath(fileUrl), {
      responseType: "blob",
    });
    return data as Blob;
  },
};
