import type { NotificationType } from "@/features/notifications/types/notification.types";

interface IconProps {
  color: string;
}

function RegistrationUpdateIcon({ color }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.5" />
      <path d="M7 10l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TeamInviteIcon({ color }: IconProps) {
  return (
    <svg width="24" height="16" viewBox="0 0 24 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="5" r="3" stroke={color} strokeWidth="1.5" />
      <path d="M2 15c0-3.314 2.686-6 6-6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="5" r="2.5" stroke={color} strokeWidth="1.5" />
      <path d="M22 15c0-2.761-2.239-5-5-5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ScorePublishedIcon({ color }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 2l2.09 4.26 4.71.68-3.4 3.32.8 4.67L9 12.5l-4.2 2.43.8-4.67-3.4-3.32 4.71-.68L9 2z"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeadlineReminderIcon({ color }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="11" r="7" stroke={color} strokeWidth="1.5" />
      <path d="M10 7v4l2.5 2.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 2l3 2 3-2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function AnnouncementIcon({ color }: IconProps) {
  return (
    <svg width="20" height="16" viewBox="0 0 20 16" fill="none" aria-hidden="true">
      <path d="M16 1v14l-5-3H4a1 1 0 01-1-1V5a1 1 0 011-1h7l5-3z"
        stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function SubmissionFeedbackIcon({ color }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M17 12a2 2 0 01-2 2H7l-4 3V5a2 2 0 012-2h10a2 2 0 012 2v7z"
        stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

const ICON_MAP: Record<NotificationType, React.ComponentType<IconProps>> = {
  registration_update: RegistrationUpdateIcon,
  team_invite: TeamInviteIcon,
  score_published: ScorePublishedIcon,
  deadline_reminder: DeadlineReminderIcon,
  announcement: AnnouncementIcon,
  submission_feedback: SubmissionFeedbackIcon,
};

const UNREAD_BG_MAP: Record<NotificationType, { bg: string; color: string }> = {
  registration_update: { bg: "#dcfce7", color: "#0ea5e9" },
  team_invite: { bg: "#fcdeb5", color: "#0ea5e9" },
  score_published: { bg: "#dcfce7", color: "#0ea5e9" },
  deadline_reminder: { bg: "#fcdeb5", color: "#0ea5e9" },
  announcement: { bg: "#fcdeb5", color: "#0ea5e9" },
  submission_feedback: { bg: "#dcfce7", color: "#0ea5e9" },
};

const READ_BG: { bg: string; color: string } = { bg: "rgba(223,226,236,0.8)", color: "#8891a5" };

interface NotificationIconProps {
  type: NotificationType;
  isRead: boolean;
}

export function NotificationIcon({ type, isRead }: NotificationIconProps) {
  const { bg, color } = isRead ? READ_BG : UNREAD_BG_MAP[type];
  const Icon = ICON_MAP[type];

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
