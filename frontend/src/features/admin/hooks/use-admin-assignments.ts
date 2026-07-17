import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assignmentApi,
  type AssignEventStaffRequest,
  type AssignJudgeRequest,
  type AssignMentorRequest,
  type AssignmentScope,
} from "@/lib/api";
import { teamApi } from "@/lib/api/team.api";
import { AVAILABLE_MENTORS_KEY } from "@/features/teams/hooks/use-mentor-invitations";

export const JUDGE_ASSIGNMENTS_KEY = "judge-assignments" as const;
export const MENTOR_ASSIGNMENTS_KEY = "mentor-assignments" as const;
export const EVENT_STAFF_JUDGES_KEY = "event-staff-judges" as const;
export const EVENT_STAFF_MENTORS_KEY = "event-staff-mentors" as const;
export const TEAM_ASSIGNMENTS_OVERVIEW_KEY = "team-assignments-overview" as const;

/* ═══════════════════════════════════════════════
 *  Event staff (event-level judges & mentors)
 * ═══════════════════════════════════════════════ */

export function useEventStaffJudges(eventId: string) {
  return useQuery({
    queryKey: [EVENT_STAFF_JUDGES_KEY, eventId],
    queryFn: () => assignmentApi.listEventJudges(eventId),
    enabled: !!eventId,
  });
}

export function useAssignEventJudge(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignEventStaffRequest) => assignmentApi.assignEventJudge(eventId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EVENT_STAFF_JUDGES_KEY, eventId] }),
  });
}

export function useRemoveEventJudge(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => assignmentApi.removeEventJudge(eventId, assignmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EVENT_STAFF_JUDGES_KEY, eventId] }),
  });
}

export function useEventStaffMentors(eventId: string) {
  return useQuery({
    queryKey: [EVENT_STAFF_MENTORS_KEY, eventId],
    queryFn: () => assignmentApi.listEventMentors(eventId),
    enabled: !!eventId,
  });
}

export function useAssignEventMentor(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignEventStaffRequest) => assignmentApi.assignEventMentor(eventId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EVENT_STAFF_MENTORS_KEY, eventId] });
      qc.invalidateQueries({ queryKey: [AVAILABLE_MENTORS_KEY] });
    },
  });
}

export function useRemoveEventMentor(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => assignmentApi.removeEventMentor(eventId, assignmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EVENT_STAFF_MENTORS_KEY, eventId] });
      qc.invalidateQueries({ queryKey: [AVAILABLE_MENTORS_KEY] });
    },
  });
}

/* ═══════════════════════════════════════════════
 *  Judge assignments (scoped to event + round + track)
 * ═══════════════════════════════════════════════ */

/** List judges assigned to a specific round (and track for preliminary rounds). */
export function useJudgeAssignments(
  eventId: string,
  roundId: string,
  params?: { trackId?: string; groupId?: string; requiresTrackId?: boolean },
) {
  const requiresTrackId = params?.requiresTrackId ?? false;
  const trackId = params?.trackId;
  return useQuery({
    queryKey: [JUDGE_ASSIGNMENTS_KEY, eventId, roundId, trackId, params?.groupId],
    queryFn: () =>
      assignmentApi.listJudges(eventId, roundId, {
        trackId,
        groupId: params?.groupId,
      }),
    enabled: !!eventId && !!roundId && (!requiresTrackId || !!trackId),
  });
}

export function useJudgeWorkloadPreview(
  eventId: string,
  roundId: string,
  scope: AssignmentScope | "",
  trackId?: string,
  groupId?: string,
) {
  return useQuery({
    queryKey: ["judge-workload-preview", eventId, roundId, scope, trackId, groupId],
    queryFn: () =>
      assignmentApi.previewWorkload(eventId, roundId, {
        scope: scope as AssignmentScope,
        trackId,
        groupId,
      }),
    enabled: !!eventId && !!roundId && !!scope,
  });
}

export function useCompetitionGroups(eventId: string, trackId: string) {
  return useQuery({
    queryKey: ["competition-groups", eventId, trackId],
    queryFn: () => assignmentApi.listCompetitionGroups(eventId, trackId),
    enabled: !!eventId && !!trackId,
  });
}

export function useCreateCompetitionGroup(eventId: string, trackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => assignmentApi.createCompetitionGroup(eventId, trackId, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["competition-groups", eventId, trackId] });
    },
  });
}

export function useDeleteCompetitionGroup(eventId: string, trackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) =>
      assignmentApi.deleteCompetitionGroup(eventId, trackId, groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["competition-groups", eventId, trackId] });
      // Deleting a group clears group_id on its teams, so the overview is stale too.
      qc.invalidateQueries({ queryKey: [TEAM_ASSIGNMENTS_OVERVIEW_KEY] });
    },
  });
}

export function useUpdateTeamGroup(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, groupId }: { teamId: string; groupId: string | null }) =>
      teamApi.updateGroup(eventId, teamId, { groupId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TEAM_ASSIGNMENTS_OVERVIEW_KEY] });
    },
  });
}

/** Assign a judge to a round (and track when preliminary). */
export function useAssignJudge(eventId: string, roundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignJudgeRequest) =>
      assignmentApi.assignJudge(eventId, roundId, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [JUDGE_ASSIGNMENTS_KEY, eventId, roundId] });
      qc.invalidateQueries({ queryKey: [TEAM_ASSIGNMENTS_OVERVIEW_KEY] });
    },
  });
}

/** Remove a judge assignment. */
export function useRemoveJudge(eventId: string, roundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) =>
      assignmentApi.removeJudge(eventId, roundId, assignmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [JUDGE_ASSIGNMENTS_KEY, eventId, roundId] });
      qc.invalidateQueries({ queryKey: [TEAM_ASSIGNMENTS_OVERVIEW_KEY] });
    },
  });
}

export function useDeactivateJudge(eventId: string, roundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, reason }: { assignmentId: string; reason: string }) =>
      assignmentApi.deactivateJudge(eventId, roundId, assignmentId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [JUDGE_ASSIGNMENTS_KEY, eventId, roundId] });
    },
  });
}

export function useActivateJudge(eventId: string, roundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) =>
      assignmentApi.activateJudge(eventId, roundId, assignmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [JUDGE_ASSIGNMENTS_KEY, eventId, roundId] });
    },
  });
}

export function useReplaceJudge(eventId: string, roundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      newJudgeUserId,
      reason,
    }: {
      assignmentId: string;
      newJudgeUserId: string;
      reason: string;
    }) => assignmentApi.replaceJudge(eventId, roundId, assignmentId, { newJudgeUserId, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [JUDGE_ASSIGNMENTS_KEY, eventId, roundId] });
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

/** List mentors for every track in an event (for cross-track conflict detection). */
export function useAllTrackMentorAssignments(eventId: string, trackIds: string[]) {
  return useQueries({
    queries: trackIds.map((trackId) => ({
      queryKey: [MENTOR_ASSIGNMENTS_KEY, eventId, trackId],
      queryFn: () => assignmentApi.listMentors(eventId, trackId),
      enabled: !!eventId && !!trackId,
    })),
  });
}

/** Assign a mentor to a track. */
export function useAssignMentor(eventId: string, trackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignMentorRequest) =>
      assignmentApi.assignMentor(eventId, trackId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MENTOR_ASSIGNMENTS_KEY, eventId] });
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
      qc.invalidateQueries({ queryKey: [MENTOR_ASSIGNMENTS_KEY, eventId] });
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
