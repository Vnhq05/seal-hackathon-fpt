"use client";

import { useRef, useState } from "react";
import { resolveFileUrl } from "@/lib/files";

interface ProfileAvatarDialogProps {
  open: boolean;
  onClose: () => void;
  avatarUrl: string | null | undefined;
  isUploading: boolean;
  isRemoving: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
  error?: string | null;
}

export function ProfileAvatarDialog({
  open,
  onClose,
  avatarUrl,
  isUploading,
  isRemoving,
  onUpload,
  onRemove,
  error,
}: ProfileAvatarDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const preview = localPreview ?? resolveFileUrl(avatarUrl);

  if (!open) return null;

  const busy = isUploading || isRemoving;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Profile avatar"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm border bg-white p-5"
        style={{
          borderColor: "rgba(223,226,236,0.8)",
          boxShadow: "0px 4px 24px rgba(0,0,0,0.12)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#0e1528",
            }}
          >
            Profile photo
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ fontSize: "12px", color: "#8891a5", background: "none", border: "none", cursor: "pointer" }}
          >
            Close
          </button>
        </div>

        {preview ? (
          <img
            src={preview}
            alt="Profile avatar preview"
            className="mx-auto mb-4 h-40 w-40 rounded-full object-cover"
            style={{ border: "4px solid #ffffff", boxShadow: "0px 1px 2px rgba(0,0,0,0.1)" }}
          />
        ) : (
          <p
            className="mb-4 text-center"
            style={{ fontSize: "12px", color: "#8891a5" }}
          >
            No photo yet. Upload one to personalize your profile.
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setLocalPreview(URL.createObjectURL(file));
            onUpload(file);
            e.target.value = "";
          }}
        />

        {error && (
          <p className="mb-3" style={{ fontSize: "12px", color: "#ba1a1a" }}>
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            style={{
              backgroundColor: "#38bdf8",
              color: "#fff",
              padding: "8px 16px",
              fontSize: "12px",
              fontWeight: 500,
              borderRadius: "8px",
              border: "none",
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.6 : 1,
            }}
          >
            {isUploading ? "Uploading…" : preview ? "Replace photo" : "Upload photo"}
          </button>
          {avatarUrl && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setLocalPreview(null);
                onRemove();
              }}
              style={{
                backgroundColor: "#fff",
                color: "#0e1528",
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: 500,
                borderRadius: "8px",
                border: "1px solid rgba(223,226,236,0.8)",
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.6 : 1,
              }}
            >
              {isRemoving ? "Removing…" : "Remove"}
            </button>
          )}
        </div>
        <p className="mt-3" style={{ fontSize: "10px", color: "#8891a5" }}>
          JPEG, PNG, or WebP · max 2 MB
        </p>
      </div>
    </div>
  );
}
