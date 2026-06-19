/* ── Assignment types ── */

export interface JudgeAssignment {
  id: string;
  judgeName: string;
  judgeEmail: string;
  judgeId: string;
  assignedRounds: { roundId: string; roundName: string }[];
  submissionsCount: number;
}

export interface JudgeAssignmentListResponse {
  data: JudgeAssignment[];
  total: number;
}

export interface AssignJudgeRequest {
  judgeId: string;
  roundId: string;
}

export interface UnassignJudgeRequest {
  judgeId: string;
  roundId: string;
}

/* ── Mentor assignment ── */

export interface MentorAssignment {
  id: string;
  mentorName: string;
  mentorEmail: string;
  mentorId: string;
  trackId: string;
  trackName: string;
  teamsCount: number;
}

export interface MentorAssignmentListResponse {
  data: MentorAssignment[];
  total: number;
}

export interface AssignMentorRequest {
  mentorId: string;
  trackId: string;
}

export interface UnassignMentorRequest {
  mentorId: string;
  trackId: string;
}

/* ── Staff assignment ── */

export type StaffPermission = "MANAGE_USERS" | "MANAGE_HACKATHONS" | "MANAGE_JUDGES" | "VIEW_ANALYTICS" | "EXPORT_DATA";

export interface StaffAssignment {
  id: string;
  staffName: string;
  staffEmail: string;
  staffId: string;
  role: string;
  permissions: StaffPermission[];
}

export interface StaffAssignmentListResponse {
  data: StaffAssignment[];
  total: number;
}

export interface AssignStaffRequest {
  staffId: string;
  role: string;
  permissions: StaffPermission[];
}

export interface UpdateStaffRequest {
  staffId: string;
  role?: string;
  permissions?: StaffPermission[];
}
