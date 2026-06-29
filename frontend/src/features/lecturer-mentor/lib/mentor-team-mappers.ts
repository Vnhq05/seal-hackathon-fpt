import type { RoundResponse } from "@/lib/api/round.api";
import type { SubmissionResponse, TeamResponse } from "@/lib/api";
import { resolveFileUrl } from "@/lib/files";
import { computeMaxWeightedScore } from "@/features/judging/schemas/scoring.schema";
import { DEFAULT_MAX_SCORE } from "@/features/judging/constants/scoring-scale";
import type {  MentorRoundSubmission,
  MentorTeam,
  MentorTeamDetail,
  MentorTeamMember,
  MentorTeamRound,
  TeamRoundStatus,
} from "@/features/lecturer-mentor/types/mentor.types";

const INITIAL_BG_COLORS = ["#dcfce7", "#e0e7ff", "#fce7f3", "#fef3c7", "#fef9c3"];

export function findCurrentRound(rounds: RoundResponse[]): RoundResponse | undefined {
  if (rounds.length === 0) return undefined;
  const now = Date.now();
  const active = rounds.find((round) => {
    const start = new Date(round.startDate).getTime();
    const end = new Date(round.submissionDeadline).getTime();
    return now >= start && now <= end;
  });
  if (active) return active;
  return [...rounds].sort((a, b) => b.roundNumber - a.roundNumber)[0];
}

function hashColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i)) % INITIAL_BG_COLORS.length;
  }
  return INITIAL_BG_COLORS[hash] ?? INITIAL_BG_COLORS[0];
}

function mapMembers(team: TeamResponse): MentorTeamMember[] {
  return team.members.map((member) => ({
    id: member.id,
    name: member.fullName ?? member.email ?? "Member",
    avatarUrl: null,
    role: member.role.replace(/_/g, " "),
    isLeader: member.userId === team.leaderId,
  }));
}

export function mapSubmissionRoundStatus(
  submission: SubmissionResponse | null,
  eliminated: boolean,
): TeamRoundStatus {
  if (eliminated) return "eliminated";
  if (!submission || submission.status === "DRAFT") return "not_submitted";
  if (submission.status === "SUBMITTED") return "pending";
  return "submitted";
}

function mapDetailRoundStatus(
  submission: SubmissionResponse | null,
): MentorRoundSubmission["status"] {
  if (!submission || submission.status === "DRAFT") return "not_submitted";
  if (submission.status === "SCORED") return "judged";
  return "needs_judging";
}

function mapSubmissionLinks(submission: SubmissionResponse | null): MentorRoundSubmission["links"] {
  const version = submission?.latestVersion;
  if (!version) return [];

  const links: MentorRoundSubmission["links"] = [];
  const sourceUrl = version.sourceCodeUrl ?? version.githubUrl;
  if (sourceUrl) {
    links.push({ label: "Source", url: sourceUrl, type: "github" });
  }
  if (version.slideUrl) {
    links.push({ label: "Slide", url: version.slideUrl, type: "demo" });
  }
  if (version.demoUrl) {
    links.push({ label: "Demo", url: version.demoUrl, type: "demo" });
  }
  if (version.attachments.length > 0) {
    const attachment = version.attachments[0];
    const resolved = resolveFileUrl(attachment.fileUrl);
    if (resolved) {
      links.push({
        label: "Document",
        url: resolved,
        type: "document",
      });
    }
  }
  return links;
}

export function mapTeamToMentorTeam(
  team: TeamResponse,
  rounds: RoundResponse[],
  submissionsByRound: Map<string, SubmissionResponse | null>,
): MentorTeam {
  const eliminated = team.status === "DISBANDED";
  const roundStatuses: MentorTeamRound[] = rounds.map((round) => ({
    roundNumber: round.roundNumber,
    status: mapSubmissionRoundStatus(submissionsByRound.get(round.id) ?? null, eliminated),
  }));

  const latestSubmission = rounds
    .map((round) => submissionsByRound.get(round.id))
    .filter((submission): submission is SubmissionResponse => submission != null)
    .sort(
      (a, b) =>
        new Date(b.latestVersion?.submittedAt ?? b.createdAt).getTime() -
        new Date(a.latestVersion?.submittedAt ?? a.createdAt).getTime(),
    )[0];

  return {
    id: team.id,
    eventId: team.eventId,
    name: team.name,
    initial: team.name.charAt(0).toUpperCase() || "?",
    initialBgColor: hashColor(team.id),
    displayId: team.id.slice(0, 8).toUpperCase(),
    memberCount: team.memberCount,
    rounds: roundStatuses,
    lastSubmission: latestSubmission?.latestVersion?.submittedAt
      ? new Date(latestSubmission.latestVersion.submittedAt).toLocaleString()
      : null,
    rank: null,
    isDisqualified: eliminated,
  };
}

export function mapTeamToMentorDetail(
  team: TeamResponse,
  rounds: RoundResponse[],
  submissionsByRound: Map<string, SubmissionResponse | null>,
  trackName: string | null,
): MentorTeamDetail {
  return {
    id: team.id,
    name: team.name,
    trackName: trackName ?? "Unassigned",
    status: team.status === "DISBANDED" ? "disqualified" : "active",
    description: `${team.memberCount} member${team.memberCount === 1 ? "" : "s"} · ${team.status.replace(/_/g, " ").toLowerCase()}`,
    memberCount: team.memberCount,
    maxMembers: Math.max(team.minTeamMembers, team.memberCount),
    members: mapMembers(team),
    rounds: rounds.map((round) => {
      const submission = submissionsByRound.get(round.id) ?? null;
      return {
        id: submission?.id ?? round.id,
        roundNumber: round.roundNumber,
        roundName: round.name,
        status: mapDetailRoundStatus(submission),
        links: mapSubmissionLinks(submission),
        mentorNotes: null,
        aggregateScore: null,
        maxScore: round.criteria?.length
          ? computeMaxWeightedScore(
              round.criteria.map((c) => ({
                maxScore: c.maxScore ?? DEFAULT_MAX_SCORE,
                weight: c.weight,
              })),
            )
          : DEFAULT_MAX_SCORE,      };
    }),
  };
}
