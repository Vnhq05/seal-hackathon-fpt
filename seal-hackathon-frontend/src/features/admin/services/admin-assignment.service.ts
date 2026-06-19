import { apiClient } from "@/lib/axios";
import type {
  JudgeAssignmentListResponse,
  AssignJudgeRequest,
  UnassignJudgeRequest,
  MentorAssignmentListResponse,
  AssignMentorRequest,
  UnassignMentorRequest,
  StaffAssignmentListResponse,
  AssignStaffRequest,
  UpdateStaffRequest,
} from "@/features/admin/types/admin-assignment.types";

/* ── Judge assignments ── */

export async function fetchJudgeAssignments(): Promise<JudgeAssignmentListResponse> {
  const { data } = await apiClient.get<JudgeAssignmentListResponse>("/admin/assignments/judges");
  return data;
}

export async function assignJudge(payload: AssignJudgeRequest): Promise<void> {
  await apiClient.post("/admin/assignments/judges", payload);
}

export async function unassignJudge(payload: UnassignJudgeRequest): Promise<void> {
  await apiClient.delete("/admin/assignments/judges", { data: payload });
}

/* ── Mentor assignments ── */

export async function fetchMentorAssignments(): Promise<MentorAssignmentListResponse> {
  const { data } = await apiClient.get<MentorAssignmentListResponse>("/admin/assignments/mentors");
  return data;
}

export async function assignMentor(payload: AssignMentorRequest): Promise<void> {
  await apiClient.post("/admin/assignments/mentors", payload);
}

export async function unassignMentor(payload: UnassignMentorRequest): Promise<void> {
  await apiClient.delete("/admin/assignments/mentors", { data: payload });
}

/* ── Staff assignments ── */

export async function fetchStaffAssignments(): Promise<StaffAssignmentListResponse> {
  const { data } = await apiClient.get<StaffAssignmentListResponse>("/admin/assignments/staff");
  return data;
}

export async function assignStaff(payload: AssignStaffRequest): Promise<void> {
  await apiClient.post("/admin/assignments/staff", payload);
}

export async function updateStaff(payload: UpdateStaffRequest): Promise<void> {
  const { staffId, ...rest } = payload;
  await apiClient.put(`/admin/assignments/staff/${staffId}`, rest);
}

export async function removeStaff(staffId: string): Promise<void> {
  await apiClient.delete(`/admin/assignments/staff/${staffId}`);
}
