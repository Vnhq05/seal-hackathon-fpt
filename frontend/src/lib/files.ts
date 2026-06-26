import { env } from "@/lib/env";

/** Resolve a backend file URL (e.g. /api/files/submissions/...) to an absolute URL. */
export function resolveFileUrl(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) return null;
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }
  const apiBase = env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "");
  return `${apiBase}${fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`}`;
}
