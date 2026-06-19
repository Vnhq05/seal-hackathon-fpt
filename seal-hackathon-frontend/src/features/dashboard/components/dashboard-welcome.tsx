"use client";

import { useAuthStore } from "@/features/auth/store/auth.store";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function DashboardWelcome() {
  const user = useAuthStore((state) => state.user);
  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <div
      className="rounded-lg"
      style={{
        background: "linear-gradient(135deg, #38bdf8 0%, #7c3aed 100%)",
        padding: "28px 32px",
      }}
    >
      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", marginBottom: "4px" }}>
        {formatTodayDate()}
      </p>
      <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#0e1528", lineHeight: "32px" }}>
        {getGreeting()}, {firstName}! 👋
      </h1>
      <p
        className="mt-2"
        style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: "21px" }}
      >
        Here&apos;s an overview of your hackathon journey.
      </p>
    </div>
  );
}
