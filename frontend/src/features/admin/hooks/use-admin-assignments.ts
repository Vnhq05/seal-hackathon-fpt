import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assignmentApi,
  type AssignJudgeRequest,
  type AssignMentorRequest,
  type JudgeAssignmentResponse,
  type MentorAssignmentResponse,
} from "@/lib/api";

export const JUDGE_ASSIGNMENTS_KEY = "judge-assignments" as const;
export const MENTOR_ASSIGNMENTS_KEY = "mentor-assignments" as const;

/* ═══════════════════════════════════════════════
 *  Judge assignments (scoped to event + round)
 * ═══════════════════════════════════════════════ */

/** List judges assigned to a specific round within an event. */
export function useJudgeAssignments(eventId: string, roundId: string) {
  return useQuery({
    queryKey: [JUDGE_ASSIGNMENTS_KEY, eventId, roundId],
    queryFn: () => assignmentApi.listJudges(eventId, roundId),
    enabled: !!eventId && !!roundId,
  });
}

/** Assign a judge to a round. */
export function useAssignJudge(eventId: string, roundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignJudgeRequest) =>
      assignmentApi.assignJudge(eventId, roundId, body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [JUDGE_ASSIGNMENTS_KEY, eventId, roundId] }),
  });
}

/** Remove a judge assignment. */
export function useRemoveJudge(eventId: string, roundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) =>
      assignmentApi.removeJudge(eventId, roundId, assignmentId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [JUDGE_ASSIGNMENTS_KEY, eventId, roundId] }),
  });
}

/* ═══════════════════════════════════════════════
 *  Mentor assignments (scoped to event)
 * ═══════════════════════════════════════════════ */

/** List mentors assigned to an event. */
export function useMentorAssignments(eventId: string) {
  return useQuery({
    queryKey: [MENTOR_ASSIGNMENTS_KEY, eventId],
    queryFn: () => assignmentApi.listMentors(eventId),
    enabled: !!eventId,
  });
}

/** Assign a mentor to an event. */
export function useAssignMentor(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignMentorRequest) =>
      assignmentApi.assignMentor(eventId, body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [MENTOR_ASSIGNMENTS_KEY, eventId] }),
  });
}

/** Remove a mentor assignment. */
export function useRemoveMentor(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) =>
      assignmentApi.removeMentor(eventId, assignmentId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [MENTOR_ASSIGNMENTS_KEY, eventId] }),
  });
}

/* ═══════════════════════════════════════════════
 *  Staff assignments — NOT supported by backend
 * ═══════════════════════════════════════════════ */

// TODO: Staff assignment endpoints do not exist in the backend.
// These are placeholder hooks that return empty data.

export const STAFF_ASSIGNMENTS_KEY = "staff-assignments" as const;

/** @deprecated Staff assignments are not supported by the backend. */
export function useStaffAssignments() {
  return useQuery({
    queryKey: [STAFF_ASSIGNMENTS_KEY],
    queryFn: () => Promise.resolve([] as never[]),
    enabled: false,
  });
}

/** @deprecated Staff assignments are not supported by the backend. No-op. */
export function useAssignStaff() {
  return useMutation({
    mutationFn: async (_payload: unknown) => {
      console.warn("[useAssignStaff] No backend endpoint for staff assignments.");
    },
  });
}

/** @deprecated Staff assignments are not supported by the backend. No-op. */
export function useUpdateStaff() {
  return useMutation({
    mutationFn: async (_payload: unknown) => {
      console.warn("[useUpdateStaff] No backend endpoint for staff assignments.");
    },
  });
}

/** @deprecated Staff assignments are not supported by the backend. No-op. */
export function useRemoveStaff() {
  return useMutation({
    mutationFn: async (_id: string) => {
      console.warn("[useRemoveStaff] No backend endpoint for staff assignments.");
    },
  });
}

// Backward-compat aliases
/** @deprecated Use useRemoveJudge instead */
export const useUnassignJudge = useRemoveJudge;
/** @deprecated Use useRemoveMentor instead */
export const useUnassignMentor = useRemoveMentor;
