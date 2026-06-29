import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  participantFeedbackApi,
  type ParticipantFeedbackResponse,
  type SubmitParticipantFeedbackRequest,
} from "@/lib/api/participant-feedback.api";

export const PARTICIPANT_FEEDBACK_KEY = "participant-feedback" as const;

async function fetchMyFeedback(
  eventId: string,
): Promise<ParticipantFeedbackResponse | null> {
  try {
    return await participantFeedbackApi.getMine(eventId);
  } catch (err) {
    if (err instanceof Error && err.message.toLowerCase().includes("not found")) {
      return null;
    }
    throw err;
  }
}

export function useMyParticipantFeedback(eventId: string | undefined) {
  return useQuery({
    queryKey: [PARTICIPANT_FEEDBACK_KEY, "me", eventId],
    queryFn: () => fetchMyFeedback(eventId!),
    enabled: !!eventId,
    retry: false,
  });
}

export function useSubmitParticipantFeedback(eventId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SubmitParticipantFeedbackRequest) =>
      participantFeedbackApi.submit(eventId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PARTICIPANT_FEEDBACK_KEY, "me", eventId] });
      queryClient.invalidateQueries({ queryKey: [PARTICIPANT_FEEDBACK_KEY, "list", eventId] });
      queryClient.invalidateQueries({ queryKey: [PARTICIPANT_FEEDBACK_KEY, "summary", eventId] });
    },
  });
}

export function useParticipantFeedbackList(eventId: string | undefined) {
  return useQuery({
    queryKey: [PARTICIPANT_FEEDBACK_KEY, "list", eventId],
    queryFn: () => participantFeedbackApi.list(eventId!),
    enabled: !!eventId,
  });
}

export function useParticipantFeedbackSummary(eventId: string | undefined) {
  return useQuery({
    queryKey: [PARTICIPANT_FEEDBACK_KEY, "summary", eventId],
    queryFn: () => participantFeedbackApi.getSummary(eventId!),
    enabled: !!eventId,
  });
}
