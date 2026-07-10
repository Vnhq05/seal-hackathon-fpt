import { useQuery } from "@tanstack/react-query";
import { eventApi } from "@/lib/api/event.api";
import { mentorInvitationApi } from "@/lib/api/mentor-invitation.api";
import { progressApi } from "@/lib/api/progress.api";
import { roundApi } from "@/lib/api/round.api";
import { submissionApi } from "@/lib/api/submission.api";
import { teamApi } from "@/lib/api/team.api";
import type { MentorTeamsParams, MentorTeamsResponse } from "@/features/lecturer-mentor/types/mentor.types";
import {
  findCurrentRound,
  mapTeamToMentorTeam,
} from "@/features/lecturer-mentor/lib/mentor-team-mappers";
import { isSubmissionDeadlineOpen } from "@/features/progress/lib/progress.utils";

export const MENTOR_TEAMS_KEY = "mentor-teams" as const;

export function useMentorTeams(params?: MentorTeamsParams) {
  return useQuery<MentorTeamsResponse>({
    queryKey: [MENTOR_TEAMS_KEY, params],
    queryFn: async (): Promise<MentorTeamsResponse> => {
      const rooms = params?.eventId
        ? await mentorInvitationApi.getMentorActiveRooms(params.eventId)
        : await mentorInvitationApi.getAllMentorActiveRooms();

      if (rooms.length === 0) {
        return {
          data: [],
          eventId: null,
          trackName: "All tracks",
          hackathonName: "",
          submittedCount: 0,
          totalTeams: 0,
          currentRound: "—",
          deadline: null,
        };
      }

      const eventIds = [...new Set(rooms.map((room) => room.eventId))];
      const eventMeta = new Map<
        string,
        { name: string; rounds: Awaited<ReturnType<typeof roundApi.list>> }
      >();

      await Promise.all(
        eventIds.map(async (eventId) => {
          const [event, rounds] = await Promise.all([
            eventApi.getById(eventId),
            roundApi.list(eventId),
          ]);
          eventMeta.set(eventId, { name: event.name, rounds });
        }),
      );

      const progressByTeamId = new Map<
        string,
        Awaited<ReturnType<typeof progressApi.getMentorAtRisk>>[number]
      >();
      await Promise.all(
        eventIds.map(async (eventId) => {
          const atRisk = await progressApi.getMentorAtRisk(eventId).catch(() => []);
          const meta = eventMeta.get(eventId);
          const currentRound = findCurrentRound(meta?.rounds ?? []);
          const deadline = currentRound?.submissionDeadline;
          for (const entry of atRisk) {
            if (
              entry.riskLevel !== "OK" &&
              isSubmissionDeadlineOpen(deadline, entry.hoursUntilDeadline)
            ) {
              progressByTeamId.set(entry.teamId, entry);
            }
          }
        }),
      );

      const primaryEventId = params?.eventId ?? rooms[0].eventId;
      const primaryMeta = eventMeta.get(primaryEventId);
      const primaryRounds = primaryMeta?.rounds ?? [];
      const currentRound = findCurrentRound(primaryRounds);
      const primaryEvent = await eventApi.getById(primaryEventId);
      const trackNames = new Map<string, string>();
      if (primaryEvent.tracks?.length) {
        for (const track of primaryEvent.tracks) {
          trackNames.set(track.id, track.name);
        }
      }

      const teams = await Promise.all(
        rooms.map(async (room) => {
          const team = await teamApi.getById(room.eventId, room.teamId);
          const meta = eventMeta.get(room.eventId);
          const eventRounds = meta?.rounds ?? [];

          const submissionsByRound = new Map(
            await Promise.all(
              eventRounds.map(async (round) => [
                round.id,
                await submissionApi.getByTeamOptional(round.id, room.teamId),
              ] as const),
            ),
          );

          return mapTeamToMentorTeam(
            team,
            eventRounds,
            submissionsByRound,
            progressByTeamId,
            meta?.name ?? "",
          );
        }),
      );

      let filteredTeams = teams;
      if (params?.filter && params.filter !== "all" && currentRound) {
        filteredTeams = teams.filter((team) => {
          const roundEntry = team.rounds.find(
            (round) => round.roundNumber === currentRound.roundNumber,
          );
          const status = roundEntry?.status ?? "not_submitted";
          if (params.filter === "submitted") {
            return status === "submitted" || status === "pending";
          }
          if (params.filter === "not_submitted") return status === "not_submitted";
          if (params.filter === "eliminated") return status === "eliminated";
          return true;
        });
      }

      if (params?.search) {
        const query = params.search.toLowerCase();
        filteredTeams = filteredTeams.filter(
          (team) =>
            team.name.toLowerCase().includes(query) ||
            team.eventName.toLowerCase().includes(query),
        );
      }

      const submittedCount = currentRound
        ? teams.filter((team) => {
            const roundEntry = team.rounds.find(
              (round) => round.roundNumber === currentRound.roundNumber,
            );
            return roundEntry?.status === "submitted" || roundEntry?.status === "pending";
          }).length
        : 0;

      return {
        data: filteredTeams,
        eventId: primaryEventId,
        trackName: params?.trackId
          ? trackNames.get(params.trackId) ?? "Assigned track"
          : "All tracks",
        hackathonName:
          eventIds.length === 1
            ? (eventMeta.get(primaryEventId)?.name ?? primaryEvent.name)
            : `${eventIds.length} competitions`,
        submittedCount,
        totalTeams: teams.length,
        currentRound: currentRound?.name ?? "No active round",
        deadline: currentRound?.submissionDeadline
          ? new Date(currentRound.submissionDeadline).toLocaleString()
          : null,
      };
    },
  });
}
