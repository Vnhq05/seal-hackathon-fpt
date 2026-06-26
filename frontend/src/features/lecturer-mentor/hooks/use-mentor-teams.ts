import { useQuery } from "@tanstack/react-query";
import { eventApi } from "@/lib/api/event.api";
import { mentorInvitationApi } from "@/lib/api/mentor-invitation.api";
import { roundApi } from "@/lib/api/round.api";
import { submissionApi } from "@/lib/api/submission.api";
import { teamApi } from "@/lib/api/team.api";
import { trackApi } from "@/lib/api/track.api";
import type { MentorTeamsParams, MentorTeamsResponse } from "@/features/lecturer-mentor/types/mentor.types";
import {
  findCurrentRound,
  mapTeamToMentorTeam,
} from "@/features/lecturer-mentor/lib/mentor-team-mappers";

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
          trackName: "All tracks",
          hackathonName: "",
          submittedCount: 0,
          totalTeams: 0,
          currentRound: "—",
          deadline: null,
        };
      }

      const primaryEventId = params?.eventId ?? rooms[0].eventId;
      const [event, rounds] = await Promise.all([
        eventApi.getById(primaryEventId),
        roundApi.list(primaryEventId),
      ]);

      const currentRound = findCurrentRound(rounds);
      const trackNames = new Map<string, string>();
      if (event.tracks?.length) {
        for (const track of event.tracks) {
          trackNames.set(track.id, track.name);
        }
      }

      const teams = await Promise.all(
        rooms.map(async (room) => {
          const team = await teamApi.getById(room.eventId, room.teamId);
          const eventRounds =
            room.eventId === primaryEventId
              ? rounds
              : await roundApi.list(room.eventId);

          const submissionsByRound = new Map(
            await Promise.all(
              eventRounds.map(async (round) => [
                round.id,
                await submissionApi.getByTeamOptional(round.id, room.teamId),
              ] as const),
            ),
          );

          let trackName = team.trackId ? trackNames.get(team.trackId) ?? null : null;
          if (!trackName && team.trackId) {
            try {
              const track = await trackApi.getById(room.eventId, team.trackId);
              trackName = track.name;
            } catch {
              trackName = null;
            }
          }

          return mapTeamToMentorTeam(team, eventRounds, submissionsByRound, trackName);
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
        filteredTeams = filteredTeams.filter((team) =>
          team.name.toLowerCase().includes(query),
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
        trackName: params?.trackId
          ? trackNames.get(params.trackId) ?? "Assigned track"
          : "All tracks",
        hackathonName: event.name,
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
