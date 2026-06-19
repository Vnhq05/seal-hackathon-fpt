"use client";

import { useRef } from "react";
import { useUploadAvatar } from "@/features/profile/hooks/use-upload-avatar";
import type { UserProfile } from "@/features/profile/types/profile.types";

interface AvatarUploaderProps {
  profile: UserProfile;
}

export function AvatarUploader({ profile }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar, isPending } = useUploadAvatar();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar(file);
      e.target.value = "";
    }
  };

  return (
    <div className="relative inline-block flex-shrink-0">
      {/* Avatar circle */}
      <div
        className="flex items-center justify-center overflow-hidden rounded-full"
        style={{ width: 80, height: 80, backgroundColor: "#38bdf8" }}
      >
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt={`${profile.name}'s avatar`}
            width={80}
            height={80}
            className="h-full w-full object-cover"
          />
        ) : (
          <span style={{ fontSize: "30px", fontWeight: 700, color: "#ffffff" }}>
            {profile.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Edit overlay */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        aria-label="Change profile picture"
        className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none disabled:cursor-not-allowed"
        style={{ backgroundColor: "rgba(0,0,0,0.48)" }}
      >
        {isPending ? (
          <svg
            className="h-5 w-5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="white"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M3 13.5V17h3.5l7.06-7.06-3.5-3.5L3 13.5zM16.71 5.79a1 1 0 000-1.41l-2.09-2.09a1 1 0 00-1.41 0l-1.63 1.63 3.5 3.5 1.63-1.63z"
              fill="white"
            />
          </svg>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
