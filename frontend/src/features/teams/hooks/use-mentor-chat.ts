import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mentorChatApi } from "@/lib/api";

const CHAT_KEY = "mentor-chat" as const;

export function useChatMessages(eventId: string, teamId: string) {
  return useQuery({
    queryKey: [CHAT_KEY, eventId, teamId],
    queryFn: () => mentorChatApi.getMessages(eventId, teamId),
    enabled: !!eventId && !!teamId,
    refetchInterval: 15000,
  });
}

export function useSendMessage(eventId: string, teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => mentorChatApi.sendMessage(eventId, teamId, { message }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAT_KEY, eventId, teamId] }),
  });
}
