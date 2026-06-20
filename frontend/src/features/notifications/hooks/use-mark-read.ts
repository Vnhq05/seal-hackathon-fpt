import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api";
import { NOTIFICATIONS_QUERY_KEY } from "@/features/notifications/hooks/use-notifications";

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipientId: string) =>
      notificationApi.markAsRead(recipientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
    },
  });
}
