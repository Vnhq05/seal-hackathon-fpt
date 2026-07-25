import { useQuery } from "@tanstack/react-query";
import { eventApi } from "@/lib/api/event.api";
import { progressApi } from "@/lib/api/progress.api";
import { roundApi } from "@/lib/api/round.api";
import { mentorInvitationApi } from "@/lib/api/mentor-invitation.api";
import { findCurrentRound } from "@/features/lecturer-mentor/lib/mentor-team-mappers";
import { isSubmissionDeadlineOpen } from "@/features/progress/lib/progress.utils";
import type {
  AtRiskTeamEntry,
  EventAtRiskGroup,
  TeamsNeedingSupportScope,
} from "@/features/progress/types/progress-board.types";
import { MY_TEAM_PROGRESS_KEY } from "@/features/dashboard/hooks/use-my-team-progress";

async function buildStaffGroups(): Promise<EventAtRiskGroup[]> {
  const events = await eventApi.list({ status: "ACTIVE", page: 0, size: 50 });
  const groups: EventAtRiskGroup[] = [];

  for (const event of events.content) {
    const rounds = await roundApi.list(event.id);
    const currentRound = findCurrentRound(rounds);
    if (!currentRound) continue;
    if (!isSubmissionDeadlineOpen(currentRound.submissionDeadline)) continue;

    const progress = await progressApi.getByRound(event.id, currentRound.id);
    const teams: AtRiskTeamEntry[] = progress
      .filter((p) =>
        isSubmissionDeadlineOpen(currentRound.submissionDeadline, p.hoursUntilDeadline),
      )
      .map((p) => ({
        ...p,
        submissionDeadline: currentRound.submissionDeadline,
      }));

    if (teams.length > 0) {
      groups.push({
        eventId: event.id,
        eventName: event.name,
        teams,
      });
    }
  }

  return groups;
}

async function buildMentorGroups(): Promise<EventAtRiskGroup[]> {
  const rooms = await mentorInvitationApi.getAllMentorActiveRooms();
  const eventIds = [...new Set(rooms.map((room) => room.eventId))];
  const groups: EventAtRiskGroup[] = [];

  for (const eventId of eventIds) {
    const [event, rounds] = await Promise.all([
      eventApi.getById(eventId).catch(() => null),
      roundApi.list(eventId),
    ]);

    if (!event) continue;

    const currentRound = findCurrentRound(rounds);
    if (!currentRound) continue;
    const deadline = currentRound.submissionDeadline ?? "";
    if (deadline && !isSubmissionDeadlineOpen(deadline)) continue;

    const progress = await progressApi.getByRound(eventId, currentRound.id).catch(() => []);
    const openTeams = progress
      .filter((team) => isSubmissionDeadlineOpen(deadline || null, team.hoursUntilDeadline))
      .map((team) => ({
        ...team,
        submissionDeadline: deadline,
      }));

    if (openTeams.length === 0) continue;

    groups.push({
      eventId,
      eventName: event.name,
      teams: openTeams,
    });
  }

  return groups;
}

export function useTeamsNeedingSupport(scope: TeamsNeedingSupportScope) {
  return useQuery<EventAtRiskGroup[]>({
    queryKey: [MY_TEAM_PROGRESS_KEY, "teams-needing-support", scope],
    queryFn: () => (scope === "mentor" ? buildMentorGroups() : buildStaffGroups()),
  });
}
