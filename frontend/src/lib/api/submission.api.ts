import { api } from "./api-client";
import { apiClient } from "@/lib/axios";
import type { ApiResponse, SubmissionStatus } from "./types";

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
  githubUrl: string;
  demoUrl: string;
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
  githubUrl: string;
  demoUrl: string;
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

    const { data } = await apiClient.post<ApiResponse<SubmissionResponse>>(
      `/rounds/${roundId}/submissions`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.data;
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
};
