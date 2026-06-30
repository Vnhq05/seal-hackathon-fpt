import { useQuery } from "@tanstack/react-query";
import { mentorInvitationApi } from "@/lib/api/mentor-invitation.api";
import { roundApi } from "@/lib/api/round.api";
import { submissionApi } from "@/lib/api/submission.api";
import type { MentorActivitiesResponse } from "@/features/lecturer-mentor/types/mentor.types";
import { findCurrentRound } from "@/features/lecturer-mentor/lib/mentor-team-mappers";

export const MENTOR_ACTIVITIES_KEY = "mentor-activities" as const;

function formatTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

export function useMentorActivities() {
  return useQuery<MentorActivitiesResponse>({
    queryKey: [MENTOR_ACTIVITIES_KEY],
    queryFn: async (): Promise<MentorActivitiesResponse> => {
      const rooms = await mentorInvitationApi.getAllMentorActiveRooms();

      if (rooms.length === 0) {
        return { data: [] };
      }

      const eventId = rooms[0].eventId;
      const rounds = await roundApi.list(eventId);
      const currentRound = findCurrentRound(rounds);

      if (!currentRound) {
        return { data: [] };
      }

      const submissions = await submissionApi.getMentorSubmissions(
        currentRound.id,
        eventId,
      );

      const teamNameById = new Map(
        rooms.map((room) => [room.teamId, room.teamName]),
      );
      const mentorTeamIds = new Set(rooms.map((r) => r.teamId));

      const activities = submissions
        .filter((s) => mentorTeamIds.has(s.teamId) && s.status !== "DRAFT")
        .map((submission) => {
          const teamName =
            teamNameById.get(submission.teamId) ??
            submission.teamId.slice(0, 8).toUpperCase();
          const submittedAt =
            submission.latestVersion?.submittedAt ?? submission.createdAt;

          return {
            id: submission.id,
            type: "submission" as const,
            message: `${teamName} submitted for ${currentRound.name}`,
            highlightText: teamName,
            timeAgo: formatTimeAgo(submittedAt),
            _sortKey: new Date(submittedAt).getTime(),
          };
        })
        .sort((a, b) => b._sortKey - a._sortKey)
        .slice(0, 10)
        .map(({ _sortKey: _, ...activity }) => activity);

      return { data: activities };
    },
  });
}
