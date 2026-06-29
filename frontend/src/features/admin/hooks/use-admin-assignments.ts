import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assignmentApi,
  type AssignJudgeRequest,
  type AssignMentorRequest,
} from "@/lib/api";
import { AVAILABLE_MENTORS_KEY } from "@/features/teams/hooks/use-mentor-invitations";

export const JUDGE_ASSIGNMENTS_KEY = "judge-assignments" as const;
export const MENTOR_ASSIGNMENTS_KEY = "mentor-assignments" as const;
export const TEAM_ASSIGNMENTS_OVERVIEW_KEY = "team-assignments-overview" as const;

/* ═══════════════════════════════════════════════
 *  Judge assignments (scoped to event + round + track)
 * ═══════════════════════════════════════════════ */

/** List judges assigned to a specific round (and track for preliminary rounds). */
export function useJudgeAssignments(
  eventId: string,
  roundId: string,
  trackId?: string,
  options?: { requiresTrackId?: boolean },
) {
  const requiresTrackId = options?.requiresTrackId ?? false;
  return useQuery({
    queryKey: [JUDGE_ASSIGNMENTS_KEY, eventId, roundId, trackId],
    queryFn: () => assignmentApi.listJudges(eventId, roundId, trackId),
    enabled: !!eventId && !!roundId && (!requiresTrackId || !!trackId),
  });
}

/** Assign a judge to a round (and track when preliminary). */
export function useAssignJudge(eventId: string, roundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignJudgeRequest) =>
      assignmentApi.assignJudge(eventId, roundId, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: [JUDGE_ASSIGNMENTS_KEY, eventId, roundId, variables.trackId],
      });
      qc.invalidateQueries({ queryKey: [TEAM_ASSIGNMENTS_OVERVIEW_KEY] });
    },
  });
}

/** Remove a judge assignment. */
export function useRemoveJudge(eventId: string, roundId: string, trackId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) =>
      assignmentApi.removeJudge(eventId, roundId, assignmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [JUDGE_ASSIGNMENTS_KEY, eventId, roundId, trackId] });
      qc.invalidateQueries({ queryKey: [TEAM_ASSIGNMENTS_OVERVIEW_KEY] });
    },
  });
}

/* ═══════════════════════════════════════════════
 *  Team assignment overview
 * ═══════════════════════════════════════════════ */

/** Team-level judge assignment overview for an event round. */
export function useTeamAssignmentsOverview(
  eventId: string,
  params: { roundId: string; season?: string; year?: number; trackId?: string },
) {
  return useQuery({
    queryKey: [TEAM_ASSIGNMENTS_OVERVIEW_KEY, eventId, params.roundId, params.trackId, params.season, params.year],
    queryFn: () => assignmentApi.getTeamAssignments(eventId, params),
    enabled: !!eventId && !!params.roundId,
  });
}

/** Remove a single team-judge link. */
export function useRemoveTeamJudgeAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => assignmentApi.removeTeamJudgeAssignment(assignmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TEAM_ASSIGNMENTS_OVERVIEW_KEY] });
    },
  });
}

/* ═══════════════════════════════════════════════
 *  Mentor assignments (scoped to event + track)
 * ═══════════════════════════════════════════════ */

/** List mentors assigned to a track. */
export function useMentorAssignments(eventId: string, trackId: string) {
  return useQuery({
    queryKey: [MENTOR_ASSIGNMENTS_KEY, eventId, trackId],
    queryFn: () => assignmentApi.listMentors(eventId, trackId),
    enabled: !!eventId && !!trackId,
  });
}

/** Assign a mentor to a track. */
export function useAssignMentor(eventId: string, trackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignMentorRequest) =>
      assignmentApi.assignMentor(eventId, trackId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MENTOR_ASSIGNMENTS_KEY, eventId, trackId] });
      qc.invalidateQueries({ queryKey: [AVAILABLE_MENTORS_KEY, eventId, trackId] });
    },
  });
}

/** Remove a mentor assignment. */
export function useRemoveMentor(eventId: string, trackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) =>
      assignmentApi.removeMentor(eventId, trackId, assignmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MENTOR_ASSIGNMENTS_KEY, eventId, trackId] });
      qc.invalidateQueries({ queryKey: [AVAILABLE_MENTORS_KEY, eventId, trackId] });
    },
  });
}

/* ═══════════════════════════════════════════════
 *  Staff assignments — NOT supported by backend
 * ═══════════════════════════════════════════════ */

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
    mutationFn: async (payload: unknown) => {
      void payload;
      console.warn("[useAssignStaff] No backend endpoint for staff assignments.");
    },
  });
}

/** @deprecated Staff assignments are not supported by the backend. No-op. */
export function useUpdateStaff() {
  return useMutation({
    mutationFn: async (payload: unknown) => {
      void payload;
      console.warn("[useUpdateStaff] No backend endpoint for staff assignments.");
    },
  });
}

/** @deprecated Staff assignments are not supported by the backend. No-op. */
export function useRemoveStaff() {
  return useMutation({
    mutationFn: async (id: string) => {
      void id;
      console.warn("[useRemoveStaff] No backend endpoint for staff assignments.");
    },
  });
}

// Backward-compat aliases
/** @deprecated Use useRemoveJudge instead */
export const useUnassignJudge = useRemoveJudge;
/** @deprecated Use useRemoveMentor instead */
export const useUnassignMentor = useRemoveMentor;
