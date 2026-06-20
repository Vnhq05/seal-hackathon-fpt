import type { NotificationType } from "@/lib/api";

interface IconProps {
  color: string;
}

function AccountIcon({ color }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="7" r="4" stroke={color} strokeWidth="1.5" />
      <path d="M3 18c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TeamIcon({ color }: IconProps) {
  return (
    <svg width="24" height="16" viewBox="0 0 24 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="5" r="3" stroke={color} strokeWidth="1.5" />
      <path d="M2 15c0-3.314 2.686-6 6-6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="5" r="2.5" stroke={color} strokeWidth="1.5" />
      <path d="M22 15c0-2.761-2.239-5-5-5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ResultsIcon({ color }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 2l2.09 4.26 4.71.68-3.4 3.32.8 4.67L9 12.5l-4.2 2.43.8-4.67-3.4-3.32 4.71-.68L9 2z"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SubmissionIcon({ color }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 4v10M10 4L7 7M10 4l3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function AssignmentIcon({ color }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.5" />
      <path d="M7 10l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DisputeIcon({ color }: IconProps) {
  return (
    <svg width="20" height="16" viewBox="0 0 20 16" fill="none" aria-hidden="true">
      <path d="M16 1v14l-5-3H4a1 1 0 01-1-1V5a1 1 0 011-1h7l5-3z"
        stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function DefaultIcon({ color }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 3a7 7 0 017 7v3l2 3H1l2-3v-3a7 7 0 017-7z"
        stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7.5 17a2.5 2.5 0 005 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const ICON_MAP: Record<NotificationType, React.ComponentType<IconProps>> = {
  ACCOUNT_APPROVED: AccountIcon,
  ACCOUNT_REJECTED: AccountIcon,
  INTERNAL_ACCOUNT_CREATED: AccountIcon,
  TEAM_REGISTERED: TeamIcon,
  TEAM_CONFIRMED: TeamIcon,
  INVITATION_RECEIVED: TeamIcon,
  MENTOR_TEAM_ASSIGNED: AssignmentIcon,
  SUBMISSION_CREATED: SubmissionIcon,
  JUDGE_ASSIGNED: AssignmentIcon,
  MENTOR_ASSIGNED: AssignmentIcon,
  SCORING_REOPENED: ResultsIcon,
  RESULTS_PUBLISHED: ResultsIcon,
  DISPUTE_FILED: DisputeIcon,
};

const UNREAD_COLORS: Record<NotificationType, { bg: string; color: string }> = {
  ACCOUNT_APPROVED: { bg: "#dcfce7", color: "#0ea5e9" },
  ACCOUNT_REJECTED: { bg: "#fcdeb5", color: "#dc2626" },
  INTERNAL_ACCOUNT_CREATED: { bg: "#dbeafe", color: "#0ea5e9" },
  TEAM_REGISTERED: { bg: "#dcfce7", color: "#0ea5e9" },
  TEAM_CONFIRMED: { bg: "#dcfce7", color: "#0ea5e9" },
  INVITATION_RECEIVED: { bg: "#fcdeb5", color: "#0ea5e9" },
  MENTOR_TEAM_ASSIGNED: { bg: "#dbeafe", color: "#0ea5e9" },
  SUBMISSION_CREATED: { bg: "#dcfce7", color: "#0ea5e9" },
  JUDGE_ASSIGNED: { bg: "#dbeafe", color: "#0ea5e9" },
  MENTOR_ASSIGNED: { bg: "#dbeafe", color: "#0ea5e9" },
  SCORING_REOPENED: { bg: "#fcdeb5", color: "#0ea5e9" },
  RESULTS_PUBLISHED: { bg: "#dcfce7", color: "#0ea5e9" },
  DISPUTE_FILED: { bg: "#fcdeb5", color: "#dc2626" },
};

const READ_BG: { bg: string; color: string } = { bg: "rgba(223,226,236,0.8)", color: "#8891a5" };

interface NotificationIconProps {
  type: NotificationType;
  isRead: boolean;
}

export function NotificationIcon({ type, isRead }: NotificationIconProps) {
  const { bg, color } = isRead ? READ_BG : (UNREAD_COLORS[type] ?? { bg: "#dbeafe", color: "#0ea5e9" });
  const Icon = ICON_MAP[type] ?? DefaultIcon;

  return (
    <div
      aria-hidden="true"
      className="flex flex-shrink-0 items-center justify-center rounded-full"
      style={{ width: 40, height: 40, backgroundColor: bg }}
    >
      <Icon color={color} />
    </div>
  );
}
