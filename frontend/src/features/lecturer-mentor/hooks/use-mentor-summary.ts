import { useQuery } from "@tanstack/react-query";
import { eventApi } from "@/lib/api/event.api";
import { mentorInvitationApi } from "@/lib/api/mentor-invitation.api";
import { roundApi } from "@/lib/api/round.api";
import { submissionApi } from "@/lib/api/submission.api";
import type { MentorSummary } from "@/features/lecturer-mentor/types/mentor.types";
import { findCurrentRound } from "@/features/lecturer-mentor/lib/mentor-team-mappers";
import { msUntil, formatCountdown } from "@/features/submissions/utils/seal-submission.utils";

export const MENTOR_SUMMARY_KEY = "mentor-summary" as const;

export function useMentorSummary(eventId?: string) {
  return useQuery<MentorSummary>({
    queryKey: [MENTOR_SUMMARY_KEY, eventId],
    queryFn: async (): Promise<MentorSummary> => {
      const rooms = eventId
        ? await mentorInvitationApi.getMentorActiveRooms(eventId)
        : await mentorInvitationApi.getAllMentorActiveRooms();

      if (rooms.length === 0) {
        return {
          trackName: "",
          hackathonName: "",
          totalTeams: 0,
          submittedCount: 0,
          currentRound: "",
          deadline: null,
          timeRemaining: null,
        };
      }

      const primaryEventId = eventId ?? rooms[0].eventId;
      const [event, rounds] = await Promise.all([
        eventApi.getById(primaryEventId),
        roundApi.list(primaryEventId),
      ]);

      const currentRound = findCurrentRound(rounds);
      const mentorTeamIds = new Set(rooms.map((room) => room.teamId));

      let submittedCount = 0;
      if (currentRound) {
        const submissions = await submissionApi.getMentorSubmissions(
          currentRound.id,
          primaryEventId,
        );
        submittedCount = submissions.filter(
          (submission) =>
            mentorTeamIds.has(submission.teamId) &&
            submission.status !== "DRAFT",
        ).length;
      }

      const deadline = currentRound?.submissionDeadline ?? null;
      const remainingMs = deadline ? msUntil(deadline) : null;

      return {
        trackName: event.tracks?.[0]?.name ?? "All tracks",
        hackathonName: event.name,
        totalTeams: rooms.length,
        submittedCount,
        currentRound: currentRound?.name ?? "No active round",
        deadline: deadline ? new Date(deadline).toLocaleString() : null,
        timeRemaining:
          remainingMs != null && remainingMs > 0 ? formatCountdown(remainingMs) : null,
      };
    },
  });
}
