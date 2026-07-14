"use client";

import { useRef, useState } from "react";
import { resolveFileUrl } from "@/lib/files";

interface EventAvatarDialogProps {
  open: boolean;
  onClose: () => void;
  avatarUrl: string | null | undefined;
  editable: boolean;
  isUploading: boolean;
  isRemoving: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
  error?: string | null;
}

export function EventAvatarDialog({
  open,
  onClose,
  avatarUrl,
  editable,
  isUploading,
  isRemoving,
  onUpload,
  onRemove,
  error,
}: EventAvatarDialogProps) {
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
      aria-label="Event avatar"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm border-2 border-navy bg-white p-5 shadow-[6px_6px_0_0_#0c1228]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-mono text-sm font-bold text-navy">Avatar</h3>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-xs text-seal-text-muted hover:text-navy"
          >
            Close
          </button>
        </div>

        {preview ? (
          <img
            src={preview}
            alt="Event avatar preview"
            className="mb-4 mx-auto h-40 w-40 border-2 border-navy object-cover"
          />
        ) : (
          <p className="mb-4 text-center font-mono text-xs text-seal-text-muted">
            No avatar uploaded yet.
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={!editable || busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setLocalPreview(URL.createObjectURL(file));
            onUpload(file);
            e.target.value = "";
          }}
        />

        {error && (
          <p className="mb-3 font-mono text-xs text-red-600">{error}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {editable && (
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-navy bg-seal-yellow px-3 py-2 font-mono text-xs font-bold text-navy disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : preview ? "Replace" : "Upload"}
            </button>
          )}
          {editable && avatarUrl && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setLocalPreview(null);
                onRemove();
              }}
              className="border-2 border-navy bg-white px-3 py-2 font-mono text-xs font-bold text-navy disabled:opacity-50"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </button>
          )}
        </div>
        <p className="mt-3 font-mono text-[10px] text-seal-text-muted">
          Optional. JPEG, PNG, or WebP · max 2 MB.
        </p>
      </div>
    </div>
  );
}
