const GITHUB_RE =
  /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?.*$/i;

const BLOCKED_HOSTS = new Set(["drive.google.com", "docs.google.com"]);

export function validateSourceCodeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return "Source code URL không hợp lệ";
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "Source code URL phải dùng http hoặc https";
    }
    const host = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTS.has(host)) {
      return "Không dùng Google Drive làm nơi chứa source code";
    }
  } catch {
    return "Source code URL không hợp lệ";
  }

  if (
    !GITHUB_RE.test(trimmed) &&
    !trimmed.includes("atlassian.net") &&
    !trimmed.includes("confluence") &&
    !trimmed.includes("notion.so") &&
    !trimmed.includes("notion.site")
  ) {
    return "Source code URL phải là GitHub, Jira, Confluence hoặc Notion";
  }

  return null;
}
