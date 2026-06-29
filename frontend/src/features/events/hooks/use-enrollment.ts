import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { enrollmentApi, type EnrollmentStatus } from "@/lib/api";

export const ENROLLMENT_KEY = "enrollment" as const;

export function enrollmentMyKey(eventId: string) {
  return [ENROLLMENT_KEY, eventId, "my"] as const;
}

export function enrollmentWaitingListKey(eventId: string) {
  return [ENROLLMENT_KEY, eventId, "waiting-list"] as const;
}

export function useMyActiveEnrollment() {
  return useQuery({
    queryKey: [ENROLLMENT_KEY, "my-active"],
    queryFn: () => enrollmentApi.getMyActiveEnrollment(),
    retry: false,
  });
}

export function useEnroll(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => enrollmentApi.enroll(eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ENROLLMENT_KEY, eventId] });
      qc.invalidateQueries({ queryKey: [ENROLLMENT_KEY, "my-active"] });
    },
  });
}

export function useMyEnrollment(eventId: string) {
  return useQuery({
    queryKey: enrollmentMyKey(eventId),
    queryFn: () => enrollmentApi.getMyEnrollment(eventId),
    enabled: !!eventId,
    retry: false,
  });
}

export function useEnrollmentList(eventId: string, status?: EnrollmentStatus) {
  return useQuery({
    queryKey: [ENROLLMENT_KEY, eventId, "list", status],
    queryFn: () => enrollmentApi.list(eventId, status ? { status } : undefined),
    enabled: !!eventId,
  });
}

export function useWaitingList(eventId: string) {
  return useQuery({
    queryKey: enrollmentWaitingListKey(eventId),
    queryFn: () => enrollmentApi.getWaitingList(eventId),
    enabled: !!eventId,
  });
}

export function useApproveEnrollment(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enrollmentId: string) => enrollmentApi.approve(eventId, enrollmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ENROLLMENT_KEY, eventId] }),
  });
}

export function useRejectEnrollment(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enrollmentId: string) => enrollmentApi.reject(eventId, enrollmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ENROLLMENT_KEY, eventId] }),
  });
}

export function useWithdrawEnrollment(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => enrollmentApi.withdraw(eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ENROLLMENT_KEY, eventId] });
      qc.invalidateQueries({ queryKey: [ENROLLMENT_KEY, "my-active"] });
    },
  });
}
