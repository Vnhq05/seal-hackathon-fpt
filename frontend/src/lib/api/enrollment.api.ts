import { api } from "./api-client";
import type { HackathonSkillRole, StudentStanding } from "./types";

// ═══ Types ═══

export type EnrollmentStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";

export interface EnrollmentResponse {
  id: string;
  userId: string;
  eventId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  userFullName: string;
  userEmail: string;
  userStudentId?: string | null;
  userUniversityName?: string | null;
  isLookingForTeam: boolean;
  preferredRole: HackathonSkillRole | null;
}

export interface UpdateMatchingProfileRequest {
  isLookingForTeam: boolean;
  preferredRole?: HackathonSkillRole | null;
}

export interface ExternalEnrollmentRequest {
  fullName: string;
  email: string;
  studentId: string;
  universityName: string;
  studentStanding: Extract<StudentStanding, "ENROLLED">;
}

// ═══ API calls ═══

export const enrollmentApi = {
  enroll(eventId: string): Promise<EnrollmentResponse> {
    return api.post<EnrollmentResponse>(`/events/${eventId}/enrollments`);
  },

  getMyEnrollment(eventId: string): Promise<EnrollmentResponse> {
    return api.get<EnrollmentResponse>(`/events/${eventId}/enrollments/my`);
  },

  updateMatchingProfile(
    eventId: string,
    body: UpdateMatchingProfileRequest,
  ): Promise<EnrollmentResponse> {
    return api.put<EnrollmentResponse>(`/events/${eventId}/enrollments/my/matching-profile`, body);
  },

  getMyActiveEnrollment(): Promise<EnrollmentResponse | null> {
    return api
      .get<EnrollmentResponse | null>(`/enrollments/my-active`)
      .then((data) => data ?? null);
  },

  list(eventId: string, params?: { status?: EnrollmentStatus }): Promise<EnrollmentResponse[]> {
    return api.get<EnrollmentResponse[]>(`/events/${eventId}/enrollments`, { params });
  },

  getWaitingList(eventId: string): Promise<EnrollmentResponse[]> {
    return api.get<EnrollmentResponse[]>(`/events/${eventId}/enrollments/waiting-list`);
  },

  approve(eventId: string, enrollmentId: string): Promise<EnrollmentResponse> {
    return api.put<EnrollmentResponse>(`/events/${eventId}/enrollments/${enrollmentId}/approve`);
  },

  reject(eventId: string, enrollmentId: string): Promise<EnrollmentResponse> {
    return api.put<EnrollmentResponse>(`/events/${eventId}/enrollments/${enrollmentId}/reject`);
  },

  withdraw(eventId: string): Promise<void> {
    return api.post<void>(`/events/${eventId}/enrollments/withdraw`);
  },

  enrollExternal(eventId: string, body: ExternalEnrollmentRequest): Promise<EnrollmentResponse> {
    return api.post<EnrollmentResponse>(`/public/events/${eventId}/enrollments`, body);
  },
};
