const GITHUB_RE =
  /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?.*$/i;

const BLOCKED_HOSTS = new Set(["drive.google.com", "docs.google.com"]);

export function validateSourceCodeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return "Invalid source code URL";
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "Source code URL must use http or https";
    }
    const host = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTS.has(host)) {
      return "Google Drive cannot be used as a source code host";
    }
  } catch {
    return "Invalid source code URL";
  }

  if (
    !GITHUB_RE.test(trimmed) &&
    !trimmed.includes("atlassian.net") &&
    !trimmed.includes("confluence") &&
    !trimmed.includes("notion.so") &&
    !trimmed.includes("notion.site")
  ) {
    return "Source code URL must be GitHub, Jira, Confluence, or Notion";
  }

  return null;
}
