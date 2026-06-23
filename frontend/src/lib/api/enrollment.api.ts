import { api } from "./api-client";

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
}

// ═══ API calls ═══

export const enrollmentApi = {
  enroll(eventId: string): Promise<EnrollmentResponse> {
    return api.post<EnrollmentResponse>(`/events/${eventId}/enrollments`);
  },

  getMyEnrollment(eventId: string): Promise<EnrollmentResponse> {
    return api.get<EnrollmentResponse>(`/events/${eventId}/enrollments/my`);
  },

  getMyActiveEnrollment(): Promise<EnrollmentResponse | null> {
    return api.get<EnrollmentResponse | null>(`/enrollments/my-active`);
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
};
