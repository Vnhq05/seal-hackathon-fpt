import { useQuery } from "@tanstack/react-query";
import { mentorInvitationApi } from "@/lib/api/mentor-invitation.api";
import { roundApi } from "@/lib/api/round.api";
import { submissionApi } from "@/lib/api/submission.api";
import { teamApi } from "@/lib/api/team.api";
import { trackApi } from "@/lib/api/track.api";
import type { MentorTeamDetailResponse } from "@/features/lecturer-mentor/types/mentor.types";
import { mapTeamToMentorDetail } from "@/features/lecturer-mentor/lib/mentor-team-mappers";

export const MENTOR_TEAM_DETAIL_KEY = "mentor-team-detail" as const;

async function resolveEventId(teamId: string, eventId?: string): Promise<string> {
  if (eventId) return eventId;
  const rooms = await mentorInvitationApi.getAllMentorActiveRooms();
  const room = rooms.find((entry) => entry.teamId === teamId);
  if (!room) {
    throw new Error("Unable to resolve event for this team");
  }
  return room.eventId;
}

async function loadSubmissionsByRound(
  rounds: Awaited<ReturnType<typeof roundApi.list>>,
  teamId: string,
): Promise<Map<string, Awaited<ReturnType<typeof submissionApi.getByTeamOptional>>>> {
  const entries = await Promise.all(
    rounds.map(async (round) => [
      round.id,
      await submissionApi.getByTeamOptional(round.id, teamId),
    ] as const),
  );
  return new Map(entries);
}

export function useMentorTeamDetail(teamId: string, eventId?: string) {
  return useQuery<MentorTeamDetailResponse>({
    queryKey: [MENTOR_TEAM_DETAIL_KEY, teamId, eventId],
    queryFn: async (): Promise<MentorTeamDetailResponse> => {
      const resolvedEventId = await resolveEventId(teamId, eventId);
      const [team, rounds] = await Promise.all([
        teamApi.getById(resolvedEventId, teamId),
        roundApi.list(resolvedEventId),
      ]);

      const submissionsByRound = await loadSubmissionsByRound(rounds, teamId);

      let trackName: string | null = null;
      if (team.trackId) {
        try {
          const track = await trackApi.getById(resolvedEventId, team.trackId);
          trackName = track.name;
        } catch {
          trackName = null;
        }
      }

      return {
        data: mapTeamToMentorDetail(team, rounds, submissionsByRound, trackName),
      };
    },
    enabled: !!teamId,
  });
}
