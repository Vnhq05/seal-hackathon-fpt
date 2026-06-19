import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markNotificationAsRead } from "@/features/notifications/services/notification.service";
import { NOTIFICATIONS_QUERY_KEY } from "@/features/notifications/hooks/use-notifications";

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
    },
  });
}
