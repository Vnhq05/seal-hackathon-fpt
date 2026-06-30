import { useQuery } from "@tanstack/react-query";
import { eventApi } from "@/lib/api/event.api";
import { mentorInvitationApi } from "@/lib/api/mentor-invitation.api";
import { roundApi } from "@/lib/api/round.api";
import { submissionApi } from "@/lib/api/submission.api";
import { teamApi } from "@/lib/api/team.api";
import { userApi } from "@/lib/api/user.api";
import type { RoundResponse } from "@/lib/api/round.api";
import type { SubmissionResponse } from "@/lib/api/submission.api";
import type { TrackResponse } from "@/lib/api/track.api";
import type {
  MentorTrackDetailResponse,
  TrackRoundTimeline,
  TrackTeamEntry,
  TrackTeamSubmissionStatus,
} from "@/features/lecturer-mentor/types/mentor-track.types";
import {
  findCurrentRound,
  mapTeamToMentorTeam,
} from "@/features/lecturer-mentor/lib/mentor-team-mappers";

export const MENTOR_TRACK_KEY = "mentor-track" as const;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString();
}

function mapSubmissionStatus(
  submission: SubmissionResponse | null,
): TrackTeamSubmissionStatus {
  if (!submission) return "missing";
  if (submission.status === "DRAFT") return "draft";
  return "submitted";
}

function mapRoundTimeline(
  rounds: Awaited<ReturnType<typeof roundApi.list>>,
  currentRoundId: string | undefined,
): TrackRoundTimeline[] {
  const now = Date.now();
  return rounds.map((round) => {
    let status: TrackRoundTimeline["status"] = "upcoming";
    if (round.id === currentRoundId) {
      status = "active";
    } else if (now > new Date(round.submissionDeadline).getTime()) {
      status = "complete";
    }

    return {
      id: round.id,
      name: round.name,
      status,
      dateRange: `${formatDate(round.startDate)} – ${formatDate(round.submissionDeadline)}`,
      note: null,
    };
  });
}

export function useMentorTrack() {
  return useQuery<MentorTrackDetailResponse>({
    queryKey: [MENTOR_TRACK_KEY],
    queryFn: async (): Promise<MentorTrackDetailResponse> => {
      const rooms = await mentorInvitationApi.getAllMentorActiveRooms();

      if (rooms.length === 0) {
        throw new Error("No mentor assignment");
      }

      const primaryEventId = rooms[0].eventId;
      const [event, rounds, profile] = await Promise.all([
        eventApi.getById(primaryEventId),
        roundApi.list(primaryEventId),
        userApi.getMyProfile(),
      ]);

      const currentRound = findCurrentRound(rounds);
      const teams = await Promise.all(
        rooms.map((room) => teamApi.getById(room.eventId, room.teamId)),
      );

      const track =
        event.tracks?.find((t: TrackResponse) => t.id === teams[0]?.trackId) ??
        event.tracks?.[0];

      if (!track) {
        throw new Error("No track found");
      }

      const submissionsByTeam = new Map(
        await Promise.all(
          teams.map(async (team) => [
            team.id,
            currentRound
              ? await submissionApi.getByTeamOptional(currentRound.id, team.id)
              : null,
          ] as const),
        ),
      );

      const trackTeamEntries: TrackTeamEntry[] = teams.map((team) => {
        const mentorTeam = mapTeamToMentorTeam(
          team,
          rounds,
          new Map(
            rounds.map((round: RoundResponse) => [
              round.id,
              round.id === currentRound?.id
                ? submissionsByTeam.get(team.id) ?? null
                : null,
            ]),
          ),
        );
        const submission = submissionsByTeam.get(team.id) ?? null;

        return {
          id: mentorTeam.id,
          name: mentorTeam.name,
          initial: mentorTeam.initial,
          initialBgColor: mentorTeam.initialBgColor,
          displayId: mentorTeam.displayId,
          memberCount: mentorTeam.memberCount,
          submissionStatus: mapSubmissionStatus(submission),
          rank: null,
        };
      });

      const submissionCount = trackTeamEntries.filter(
        (entry) => entry.submissionStatus === "submitted",
      ).length;

      return {
        data: {
          id: track.id,
          name: track.name,
          hackathonName: event.name,
          description: track.description ?? "",
          maxTeams: track.maxTeams,
          registeredTeams: track.assignedTeamCount ?? teams.length,
          currentRound: currentRound?.name ?? "No active round",
          submissionCount,
          totalTeams: teams.length,
          mentorName: profile.fullName || "You",
          mentorAvatarUrl: null,
          mentorSpecialty: track.name,
          teams: trackTeamEntries,
          totalTeamCount: teams.length,
          rounds: mapRoundTimeline(rounds, currentRound?.id),
        },
      };
    },
  });
}
