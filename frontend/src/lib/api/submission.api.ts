import { api } from "./api-client";
import { apiClient } from "@/lib/axios";
import type { ApiResponse, SubmissionStatus } from "./types";

/** Max size for Other-section file uploads (25 MB). */
export const SUBMISSION_MAX_FILE_BYTES = 25 * 1024 * 1024;

/** @deprecated Use SUBMISSION_MAX_FILE_BYTES */
export const SUBMISSION_MAX_PDF_BYTES = SUBMISSION_MAX_FILE_BYTES;

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
  pageCount?: number | null;
  contentType?: string | null;
}

export interface SubmissionVersionResponse {
  id: string;
  versionNumber: number;
  /** Canonical source code URL */
  sourceCodeUrl?: string | null;
  slideUrl?: string | null;
  otherUrl?: string | null;
  /** @deprecated Prefer otherUrl — legacy demo / mapped Other */
  demoUrl?: string | null;
  /** @deprecated Use sourceCodeUrl — backend alias for backward compatibility */
  githubUrl?: string | null;
  submittedAt: string;
  attachments: AttachmentResponse[];
}

export interface SubmissionResponse {
  id: string;
  teamId: string;
  teamName?: string | null;
  trackId?: string | null;
  trackName?: string | null;
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
  /** Any http(s) link under the Other section */
  otherUrl?: string;
  /** @deprecated Prefer otherUrl */
  demoUrl?: string;
  /** @deprecated Use sourceCodeUrl — still accepted by backend */
  githubUrl?: string;
}

// ═══ API calls ═══

export const submissionApi = {
  async submit(
    roundId: string,
    request: CreateSubmissionRequest,
    file?: File | null,
  ): Promise<SubmissionResponse> {
    const formData = new FormData();
    formData.append(
      "submission",
      new Blob([JSON.stringify(request)], { type: "application/json" }),
    );
    if (file) {
      formData.append("file", file);
    }

    // Omit Content-Type so the browser sets multipart boundary.
    // (apiClient defaults to application/json; `false` tells axios to drop it.)
    const { data: wrapper } = await apiClient.post<ApiResponse<SubmissionResponse>>(
      `/rounds/${roundId}/submissions`,
      formData,
      { headers: { "Content-Type": false } },
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

  list(roundId: string, trackId?: string | null): Promise<SubmissionResponse[]> {
    return api.get<SubmissionResponse[]>(`/rounds/${roundId}/submissions`, {
      params: trackId ? { trackId } : undefined,
    });
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

  /** GET /api/files/submissions/** — download attachment (inline). */
  async downloadAttachment(fileUrl: string): Promise<Blob> {
    const { data } = await apiClient.get(normalizeSubmissionFilePath(fileUrl), {
      responseType: "blob",
    });
    return data as Blob;
  },
};
