import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchJudgeAssignments,
  assignJudge,
  unassignJudge,
  fetchMentorAssignments,
  assignMentor,
  unassignMentor,
  fetchStaffAssignments,
  assignStaff,
  updateStaff,
  removeStaff,
} from "@/features/admin/services/admin-assignment.service";
import type {
  AssignJudgeRequest,
  UnassignJudgeRequest,
  AssignMentorRequest,
  UnassignMentorRequest,
  AssignStaffRequest,
  UpdateStaffRequest,
} from "@/features/admin/types/admin-assignment.types";

export const JUDGE_ASSIGNMENTS_KEY = "judge-assignments" as const;
export const MENTOR_ASSIGNMENTS_KEY = "mentor-assignments" as const;
export const STAFF_ASSIGNMENTS_KEY = "staff-assignments" as const;

/* ── Judge ── */

export function useJudgeAssignments() {
  return useQuery({
    queryKey: [JUDGE_ASSIGNMENTS_KEY],
    queryFn: fetchJudgeAssignments,
  });
}

export function useAssignJudge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: AssignJudgeRequest) => assignJudge(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: [JUDGE_ASSIGNMENTS_KEY] }),
  });
}

export function useUnassignJudge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: UnassignJudgeRequest) => unassignJudge(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: [JUDGE_ASSIGNMENTS_KEY] }),
  });
}

/* ── Mentor ── */

export function useMentorAssignments() {
  return useQuery({
    queryKey: [MENTOR_ASSIGNMENTS_KEY],
    queryFn: fetchMentorAssignments,
  });
}

export function useAssignMentor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: AssignMentorRequest) => assignMentor(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MENTOR_ASSIGNMENTS_KEY] }),
  });
}

export function useUnassignMentor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: UnassignMentorRequest) => unassignMentor(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: [MENTOR_ASSIGNMENTS_KEY] }),
  });
}

/* ── Staff ── */

export function useStaffAssignments() {
  return useQuery({
    queryKey: [STAFF_ASSIGNMENTS_KEY],
    queryFn: fetchStaffAssignments,
  });
}

export function useAssignStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: AssignStaffRequest) => assignStaff(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: [STAFF_ASSIGNMENTS_KEY] }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: UpdateStaffRequest) => updateStaff(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: [STAFF_ASSIGNMENTS_KEY] }),
  });
}

export function useRemoveStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeStaff(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [STAFF_ASSIGNMENTS_KEY] }),
  });
}
