import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markAllNotificationsAsRead } from "@/features/notifications/services/notification.service";
import { NOTIFICATIONS_QUERY_KEY } from "@/features/notifications/hooks/use-notifications";

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
    },
  });

  return { markAllRead: mutate, isPending };
}
