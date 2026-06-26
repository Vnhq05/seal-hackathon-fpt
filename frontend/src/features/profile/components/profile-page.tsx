"use client";

import { useState } from "react";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { ProfileHeader } from "@/features/profile/components/profile-header";
import { ProfileInfoForm } from "@/features/profile/components/profile-info-form";
import { ChangePasswordForm } from "@/features/profile/components/change-password-form";
import { SetupOfficialPasswordForm } from "@/features/profile/components/setup-official-password-form";
import type { ProfileTab } from "@/features/profile/components/profile-header";

function ProfileSkeleton() {
  return (
    <div className="flex animate-pulse flex-col" style={{ gap: 16 }}>
      <div className="rounded-lg" style={{ height: 270, backgroundColor: "rgba(223,226,236,0.8)" }} />
      <div className="rounded-lg" style={{ height: 300, backgroundColor: "rgba(223,226,236,0.8)" }} />
    </div>
  );
}

function ProfileError() {
  return (
    <div
      className="rounded-lg p-10 text-center"
      style={{ border: "1px solid rgba(223,226,236,0.8)", backgroundColor: "#fff" }}
    >
      <p style={{ fontSize: "15px", color: "#8891a5" }}>
        Unable to load profile. Please refresh the page.
      </p>
    </div>
  );
}

function Breadcrumb() {
  return (
    <div className="flex items-center gap-1">
      <span
        style={{
          fontSize: "14px",
          fontWeight: 400,
          color: "#8891a5",
          lineHeight: "20px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        Settings
      </span>
      <span
        style={{
          fontSize: "14px",
          fontWeight: 400,
          color: "#8891a5",
          lineHeight: "20px",
        }}
      >
        /
      </span>
      <span
        style={{
          fontSize: "14px",
          fontWeight: 500,
          color: "#0e1528",
          lineHeight: "20px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        Profile
      </span>
    </div>
  );
}

export function ProfilePage() {
  const { data: profile, isLoading, isError } = useProfile();
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");

  if (isLoading) return <ProfileSkeleton />;
  if (isError || !profile) return <ProfileError />;

  return (
    <div className="flex flex-col" style={{ gap: 16 }}>
      <Breadcrumb />
      <ProfileHeader
        profile={profile}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "personal" && <ProfileInfoForm profile={profile} />}
      {activeTab === "security" && (
        profile.temporaryAccount && profile.userType === "EXTERNAL_STUDENT" ? (
          <SetupOfficialPasswordForm />
        ) : (
          <ChangePasswordForm />
        )
      )}
      {activeTab === "events" && (
        <div
          className="rounded-lg bg-seal-surface p-10 text-center"
          style={{
            border: "1px solid rgba(223,226,236,0.8)",
            boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
          }}
        >
          <p style={{ fontSize: "14px", color: "#8891a5" }}>
            Your events will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
