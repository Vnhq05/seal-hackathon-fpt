import type { AllowedEmailDomainResponse } from "@/lib/api/event.api";

export function extractEmailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 0) return "";
  return email.slice(at + 1).trim().toLowerCase();
}

export function normalizeRuleDomain(domain: string): string {
  const trimmed = domain.trim().toLowerCase();
  return trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
}

export function matchesAllowedDomain(email: string, allowedDomains: string[]): boolean {
  const emailDomain = extractEmailDomain(email);
  if (!emailDomain || allowedDomains.length === 0) return false;
  return allowedDomains.some((rule) => {
    const normalized = normalizeRuleDomain(rule);
    if (!normalized) return false;
    return emailDomain === normalized || emailDomain.endsWith(`.${normalized}`);
  });
}

/** External student emails must use a Vietnamese university domain ending in `.edu.vn`. */
export function isEduVnEmail(email: string): boolean {
  const emailDomain = extractEmailDomain(email);
  if (!emailDomain) return false;
  return emailDomain === "edu.vn" || emailDomain.endsWith(".edu.vn");
}

export function uniqueUniversityLabels(domains: AllowedEmailDomainResponse[]): string[] {
  const labels = new Set<string>();
  for (const d of domains) {
    if (d.universityLabel?.trim()) {
      labels.add(d.universityLabel.trim());
    }
  }
  return [...labels].sort((a, b) => a.localeCompare(b, "vi"));
}

export function universityMatchesEmail(
  email: string,
  universityName: string,
  domains: AllowedEmailDomainResponse[],
): boolean {
  const normalizedUniversity = universityName.trim();
  if (!normalizedUniversity) return false;
  return domains
    .filter((d) => matchesAllowedDomain(email, [d.domain]))
    .some(
      (d) =>
        d.universityLabel != null &&
        normalizedUniversity.localeCompare(d.universityLabel.trim(), "vi", {
          sensitivity: "accent",
        }) === 0,
    );
}
