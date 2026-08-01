import type { UserAchievement } from "@/lib/api/admin-user.api";
import type { UserProfile } from "@/lib/api/user.api";
import { formatPrizeAmount, PRIZE_RANK_LABELS } from "@/lib/prize.utils";
import type { CertificateTemplateData } from "@/features/profile/types/certificate.types";

const PRIZE_CODE: Record<string, string> = {
  FIRST: "WIN",
  SECOND: "SIL",
  THIRD: "BRZ",
  CONSOLATION: "ENC",
  OTHER: "SPC",
};

/** Known Vietnamese prize titles → English display. */
const VI_TO_EN_PRIZE: Record<string, string> = {
  "giải nhất": "First Prize",
  "giai nhat": "First Prize",
  "giải nhì": "Second Prize",
  "giai nhi": "Second Prize",
  "giải ba": "Third Prize",
  "giai ba": "Third Prize",
  "giải khuyến khích": "Encouragement Prize",
  "giai khuyen khich": "Encouragement Prize",
  "encouragement prize": "Encouragement Prize",
  "consolation prize": "Encouragement Prize",
  "giải thưởng": "Team Award",
  "giai thuong": "Team Award",
  "chứng nhận tham gia": "Participation Certificate",
  "chung nhan tham gia": "Participation Certificate",
};

function normalizePrizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function toEnglishPrizeLabel(raw: string | null | undefined, fallback: string): string {
  if (!raw?.trim()) return fallback;
  const trimmed = raw.trim();
  const mapped = VI_TO_EN_PRIZE[normalizePrizeKey(trimmed)];
  return mapped ?? trimmed;
}

export function formatAchievementPrize(achievement: UserAchievement): {
  label: string;
  detail: string | null;
} {
  if (achievement.type === "PARTICIPATION_CERTIFICATE") {
    return {
      label: "Participation Certificate",
      detail: achievement.description,
    };
  }

  const raw = achievement.description?.trim() || null;
  const detail = raw ? formatPrizeAmount(raw) : null;

  if (achievement.prizeRank) {
    const fromEvent = achievement.title?.trim();
    // Always show English. Map Vietnamese DB labels; keep custom English titles from edit event.
    if (fromEvent && fromEvent !== "Prizes") {
      const translated = toEnglishPrizeLabel(fromEvent, PRIZE_RANK_LABELS[achievement.prizeRank]);
      return { label: translated, detail };
    }
    return { label: PRIZE_RANK_LABELS[achievement.prizeRank], detail };
  }

  return {
    label: toEnglishPrizeLabel(achievement.title, "Team Award"),
    detail,
  };
}

export function buildCertificateId(achievement: UserAchievement): string {
  const year = new Date(achievement.achievedAt).getFullYear();
  const code =
    achievement.type === "PARTICIPATION_CERTIFICATE"
      ? "PRT"
      : achievement.prizeRank
        ? PRIZE_CODE[achievement.prizeRank]
        : "AWD";
  const short = achievement.id.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `SEAL-${year}-${code}-${short}`;
}

export function buildProjectContent(
  achievement: UserAchievement,
  prizeDetail: string | null,
): string {
  if (achievement.type === "PARTICIPATION_CERTIFICATE") {
    return (
      prizeDetail?.trim() ||
      "Completed the hackathon with creativity, collaboration, and dedication."
    );
  }

  if (prizeDetail?.trim()) {
    return prizeDetail.trim();
  }

  return `Outstanding project by team ${achievement.teamName || "participant"} at ${achievement.eventName || "the hackathon"}.`;
}

/**
 * Map achievement + profile → certificate template props.
 * Later you only change this mapper (or the API fields) — the visual template stays fixed.
 */
export function buildCertificateData(
  achievement: UserAchievement,
  profile?: Pick<UserProfile, "fullName"> | null,
): CertificateTemplateData {
  const prize = formatAchievementPrize(achievement);

  return {
    eventName: (achievement.eventName || "SEAL HACKATHON").toUpperCase(),
    teamName: achievement.teamName || "—",
    prizeLabel: prize.label.toUpperCase(),
    projectContent: buildProjectContent(achievement, prize.detail),
    certificateId: buildCertificateId(achievement),
    achievedAt: achievement.achievedAt,
    recipientName: profile?.fullName,
    universityLogoUrl: "/certificates/fpt-education-logo.png",
    hackathonLogoUrl: "/logo-removebg-preview.png",
    type: achievement.type,
  };
}
