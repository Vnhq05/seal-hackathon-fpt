/* ── Judge assignment (from JudgeAssignmentResponse) ── */

export interface JudgeAssignment {
  id: string;
  roundId: string;
  trackId: string | null;
  trackName: string | null;
  judgeUserId: string;
  judgeFullName: string | null;
  judgeEmail: string | null;
  assignedAt: string;
}

/* ── Mentor assignment (from MentorAssignmentResponse) ── */

export interface MentorAssignment {
  id: string;
  eventId: string;
  trackId: string;
  trackName: string | null;
  mentorUserId: string;
  mentorFullName: string | null;
  mentorEmail: string | null;
  assignedAt: string;
}

/* ── Staff assignment (no backend support) ── */

export type StaffPermission = "MANAGE_USERS" | "MANAGE_HACKATHONS" | "MANAGE_JUDGES" | "VIEW_ANALYTICS" | "EXPORT_DATA";

export interface StaffAssignment {
  id: string;
  staffName: string;
  staffEmail: string;
  staffId: string;
  role: string;
  permissions: StaffPermission[];
}
