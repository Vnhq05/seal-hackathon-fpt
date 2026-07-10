import { env } from "@/lib/env";
import { submissionApi } from "@/lib/api/submission.api";

/** Resolve a backend file URL (e.g. /api/files/submissions/...) to an absolute URL. */
export function resolveFileUrl(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) return null;
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }
  const apiBase = env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "");
  return `${apiBase}${fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`}`;
}

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Open a submission PDF in a new tab via authenticated API (direct URLs return 401). */
export async function openSubmissionAttachment(fileUrl: string): Promise<void> {
  const blob = await submissionApi.downloadAttachment(fileUrl);
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    URL.revokeObjectURL(url);
    throw new Error("Could not open PDF. Please allow popups for this site.");
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
