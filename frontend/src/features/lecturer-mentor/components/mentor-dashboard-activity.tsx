"use client";

import { useMentorActivities } from "@/features/lecturer-mentor/hooks/use-mentor-activities";
import type { MentorActivityType } from "@/features/lecturer-mentor/types/mentor.types";

const ICON_COLORS: Record<MentorActivityType, string> = {
  submission: "#d1fae5",
  registration: "#e0e7ff",
  round_opened: "#dcfce7",
  feedback_completed: "rgba(223,226,236,0.8)",
};

function SubmissionIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M3 6.5l2.5 2.5L10 4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RegistrationIcon() {
  return (
    <svg width="15" height="11" viewBox="0 0 15 11" fill="none" aria-hidden="true">
      <circle cx="5.5" cy="3.5" r="2.5" stroke="#38bdf8" strokeWidth="1.2" />
      <path d="M1 11c0-2.5 2-4.5 4.5-4.5S10 8.5 10 11" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11 3v4M13 5h-4" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function RoundIcon() {
  return (
    <svg width="11" height="14" viewBox="0 0 11 14" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="9" height="12" rx="1.5" stroke="#38bdf8" strokeWidth="1.2" />
      <path d="M3 5h5M3 8h3" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function FeedbackIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 12l2-3H4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICON_MAP: Record<MentorActivityType, React.ReactNode> = {
  submission: <SubmissionIcon />,
  registration: <RegistrationIcon />,
  round_opened: <RoundIcon />,
  feedback_completed: <FeedbackIcon />,
};

export function MentorDashboardActivity() {
  const { data, isLoading } = useMentorActivities();
  const activities = data?.data ?? [];

  return (
    <div
      className="flex flex-col overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
      style={{ backgroundColor: "#eef0f6", border: "1px solid rgba(223,226,236,0.8)", boxShadow: "0px 1px 2px rgba(0,0,0,0.05)", height: "100%" }}
    >
      <div style={{ borderBottom: "1px solid rgba(223,226,236,0.8)", padding: "20px 24px" }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", lineHeight: "25.2px" }}>Recent Activity</h2>
      </div>

      <div className="flex-1 overflow-auto" style={{ padding: 20, position: "relative" }}>
        {isLoading ? (
          <div className="flex flex-col gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="animate-pulse rounded-full" style={{ width: 32, height: 32, backgroundColor: "rgba(223,226,236,0.8)", flexShrink: 0 }} />
                <div className="flex-1">
                  <div className="animate-pulse rounded" style={{ height: 14, width: "80%", backgroundColor: "rgba(223,226,236,0.8)" }} />
                  <div className="animate-pulse rounded" style={{ height: 10, width: "40%", backgroundColor: "rgba(223,226,236,0.8)", marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p style={{ fontSize: 14, color: "#8891a5", textAlign: "center", padding: "32px 0" }}>
            No recent activity.
          </p>
        ) : (
          <div style={{ position: "relative", paddingLeft: 16 }}>
            <div style={{ position: "absolute", left: 15, top: 20, bottom: 20, width: 1, backgroundColor: "rgba(223,226,236,0.8)" }} />
            <div className="flex flex-col gap-6">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-4" style={{ position: "relative" }}>
                  <div
                    className="flex flex-shrink-0 items-center justify-center rounded-full"
                    style={{ width: 32, height: 32, backgroundColor: ICON_COLORS[activity.type], border: "2px solid #06110f", zIndex: 1 }}
                  >
                    {ICON_MAP[activity.type]}
                  </div>
                  <div className="flex flex-col">
                    <p style={{ fontSize: 13, color: "#0e1528", lineHeight: "19.5px" }}>
                      {activity.highlightText ? (
                        <>
                          {activity.message.split(activity.highlightText)[0]}
                          <strong>{activity.highlightText}</strong>
                          {activity.message.split(activity.highlightText)[1]}
                        </>
                      ) : (
                        activity.message
                      )}
                    </p>
                    <span style={{ fontSize: 11, color: "#8891a5", lineHeight: "16.5px", marginTop: 4 }}>
                      {activity.timeAgo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className="flex items-center justify-center"
        style={{ borderTop: "1px solid rgba(223,226,236,0.8)", padding: "16px 24px", backgroundColor: "#ffffff" }}
      >
        <button type="button" style={{ fontSize: 12, fontWeight: 500, color: "#38bdf8", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.24px" }}>
          View all activity
        </button>
      </div>
    </div>
  );
}
