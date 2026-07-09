"use client";

import { useEffect, useState } from "react";
import { submissionApi } from "@/lib/api/submission.api";
import { openSubmissionAttachment } from "@/lib/files";

interface SubmissionPdfViewerProps {
  fileUrl: string;
  fileName?: string | null;
  className?: string;
}

export function SubmissionPdfViewer({ fileUrl, fileName, className }: SubmissionPdfViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    async function load() {
      setLoading(true);
      setError(null);
      setBlobUrl(null);
      try {
        const blob = await submissionApi.downloadAttachment(fileUrl);
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load PDF");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileUrl]);

  const frameClassName = className ?? "h-[480px] w-full rounded border border-seal-border";

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-seal-surface-sunken text-sm text-seal-text-muted ${frameClassName}`}
      >
        Loading PDF...
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-seal-surface-sunken p-4 text-center text-sm text-seal-text-muted ${frameClassName}`}
      >
        <p>{error ?? "Could not load PDF"}</p>
        <button
          type="button"
          onClick={() => void openSubmissionAttachment(fileUrl)}
          className="text-xs font-semibold text-royal underline"
        >
          Open PDF in new tab
        </button>
      </div>
    );
  }

  return <iframe src={blobUrl} title={fileName ?? "Submission PDF"} className={frameClassName} />;
}
