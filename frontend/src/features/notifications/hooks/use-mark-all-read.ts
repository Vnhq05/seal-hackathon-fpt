import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api";
import { NOTIFICATIONS_QUERY_KEY } from "@/features/notifications/hooks/use-notifications";

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
    },
  });

  return { markAllRead: mutate, isPending };
}
