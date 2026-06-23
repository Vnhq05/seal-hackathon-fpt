"use client";

import type { UserType, AccountStatus } from "@/lib/api/types";
import type { UserProfile } from "@/lib/api/user.api";

export type ProfileTab = "personal" | "security" | "events";

const USER_TYPE_LABEL: Record<UserType, string> = {
  FPT_STUDENT: "FPT Student",
  EXTERNAL_STUDENT: "External Student",
  LECTURER: "Lecturer",
  EVENT_COORDINATOR: "Event Coordinator",
  SYSTEM_ADMIN: "System Admin",
};

const STATUS_STYLE: Record<AccountStatus, { bg: string; dotColor: string; textColor: string; borderColor: string }> = {
  ACTIVE: { bg: "#ecfdf5", dotColor: "#10b981", textColor: "#047857", borderColor: "rgba(16, 185, 129, 0.2)" },
  PENDING: { bg: "#fffbeb", dotColor: "#f59e0b", textColor: "#b45309", borderColor: "rgba(245, 158, 11, 0.2)" },
  REJECTED: { bg: "#fef2f2", dotColor: "#ef4444", textColor: "#dc2626", borderColor: "rgba(239, 68, 68, 0.2)" },
  LOCKED: { bg: "#f3f4f6", dotColor: "#6b7280", textColor: "#374151", borderColor: "rgba(107, 114, 128, 0.2)" },
};

const STATUS_DISPLAY: Record<AccountStatus, string> = {
  ACTIVE: "Active",
  PENDING: "Pending",
  REJECTED: "Rejected",
  LOCKED: "Locked",
};

const TABS: { key: ProfileTab; label: string }[] = [
  { key: "personal", label: "Personal Info" },
  { key: "security", label: "Security" },
  { key: "events", label: "My Events" },
];

function EditIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2 8.5V10h1.5L9.06 4.44l-1.5-1.5L2 8.5zM10.41 3.09a.38.38 0 000-.54L9.45 1.59a.38.38 0 00-.54 0L8.13 2.38l1.5 1.5.78-.79z"
        fill="#0e1528"
      />
    </svg>
  );
}

interface ProfileHeaderProps {
  profile: UserProfile;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

export function ProfileHeader({ profile, activeTab, onTabChange }: ProfileHeaderProps) {
  const initials = profile.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const status = profile.status ?? "ACTIVE";
  const statusStyle = STATUS_STYLE[status] ?? STATUS_STYLE.ACTIVE;

  return (
    <div
      className="relative overflow-hidden rounded-lg bg-seal-surface"
      style={{
        border: "1px solid rgba(223,226,236,0.8)",
        boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Navy gradient banner */}
      <div
        style={{
          height: 80,
          background: "linear-gradient(to right, #0ea5e9, #6366f1)",
        }}
      />

      {/* Content below banner */}
      <div style={{ padding: "0 24px 0 24px" }}>
        {/* Avatar & Edit row */}
        <div className="flex items-end justify-between" style={{ marginTop: -40 }}>
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 80,
              height: 80,
              backgroundColor: "#38bdf8",
              border: "4px solid #ffffff",
              boxShadow: "0px 1px 1px rgba(0, 0, 0, 0.05)",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: "24px",
                fontWeight: 600,
                color: "#0e1528",
                lineHeight: "31.2px",
                letterSpacing: "-0.24px",
              }}
            >
              {initials}
            </span>
          </div>

          <button
            className="flex items-center gap-1 rounded-lg bg-seal-surface"
            style={{
              border: "1px solid rgba(223,226,236,0.8)",
              padding: "9px 17px",
              boxShadow: "0px 1px 1px rgba(0, 0, 0, 0.05)",
              fontSize: "12px",
              fontWeight: 500,
              color: "#0e1528",
              letterSpacing: "0.24px",
              lineHeight: "12px",
            }}
          >
            <EditIcon />
            Edit profile
          </button>
        </div>

        {/* Name + status badge */}
        <div className="flex items-center gap-2" style={{ marginTop: 16 }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "#0e1528",
              lineHeight: "31.2px",
              letterSpacing: "-0.24px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {profile.fullName}
          </h1>
          <span
            className="inline-flex items-center gap-1 rounded-full"
            style={{
              backgroundColor: statusStyle.bg,
              border: `1px solid ${statusStyle.borderColor}`,
              padding: "3px 9px",
            }}
          >
            <span
              className="rounded-full"
              style={{
                width: 6,
                height: 6,
                backgroundColor: statusStyle.dotColor,
                display: "block",
              }}
            />
            <span
              style={{
                fontSize: "10px",
                fontWeight: 400,
                color: statusStyle.textColor,
                lineHeight: "15px",
              }}
            >
              {STATUS_DISPLAY[status] ?? status}
            </span>
          </span>
        </div>

        {/* Email + user type */}
        <div className="flex items-center gap-4" style={{ marginTop: 4 }}>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 400,
              color: "#8891a5",
              lineHeight: "21px",
            }}
          >
            {profile.email}
          </span>
          <span
            className="rounded-full"
            style={{
              width: 4,
              height: 4,
              backgroundColor: "rgba(223,226,236,0.8)",
              display: "block",
              flexShrink: 0,
            }}
          />
          <span
            className="rounded"
            style={{
              backgroundColor: "rgba(223,226,236,0.8)",
              padding: "4px 8px",
              fontSize: "12px",
              fontWeight: 500,
              color: "#8891a5",
              lineHeight: "16px",
            }}
          >
            {USER_TYPE_LABEL[profile.userType] ?? profile.userType}
          </span>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-6"
          role="tablist"
          aria-label="Profile sections"
          style={{
            borderTop: "1px solid rgba(223,226,236,0.8)",
            marginTop: 24,
            paddingTop: 1,
          }}
        >
          {TABS.map(({ key, label }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(key)}
                className="focus:outline-none"
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: isActive ? "#000000" : "#8891a5",
                  letterSpacing: "0.24px",
                  lineHeight: "12px",
                  padding: "16px 0 18px 0",
                  borderBottom: isActive ? "2px solid #38bdf8" : "2px solid transparent",
                  background: "none",
                  border: "none",
                  borderBottomWidth: 2,
                  borderBottomStyle: "solid",
                  borderBottomColor: isActive ? "#38bdf8" : "transparent",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
