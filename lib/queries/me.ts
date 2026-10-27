import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  getCurrentUser,
  getWorkspaceCounts,
  listNotifications,
  markAllNotificationsRead,
} from "@/lib/api/me";

/**
 * Query keys and options for the signed-in user's own data. Keys are
 * hierarchical, so `invalidateQueries({ queryKey: meQueries.all() })` reaches
 * every one of them at once.
 */
export const meQueries = {
  all: () => ["me"] as const,
  user: () =>
    queryOptions({
      queryKey: [...meQueries.all(), "user"],
      queryFn: ({ signal }) => getCurrentUser({ signal }),
      // Who you are doesn't change mid-session.
      staleTime: Infinity,
    }),
  counts: () =>
    queryOptions({
      queryKey: [...meQueries.all(), "counts"],
      queryFn: ({ signal }) => getWorkspaceCounts({ signal }),
      // Keeps the nav badges current while the app sits open.
      refetchInterval: 60_000,
    }),
  notifications: () =>
    queryOptions({
      queryKey: [...meQueries.all(), "notifications"],
      queryFn: ({ signal }) => listNotifications({ signal }),
    }),
};

export const useCurrentUser = () => useSuspenseQuery(meQueries.user());
export const useWorkspaceCounts = () => useSuspenseQuery(meQueries.counts());
export const useNotifications = () => useSuspenseQuery(meQueries.notifications());

/**
 * Optimistic: the list and the unread badge update the moment it's clicked,
 * and roll back if the server refuses. Either way both are refetched after,
 * so the screen ends up showing what the server actually has.
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const listKey = meQueries.notifications().queryKey;
  const countsKey = meQueries.counts().queryKey;

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      // Stop an in-flight refetch from landing on top of the optimistic state.
      await Promise.all([
        queryClient.cancelQueries({ queryKey: listKey }),
        queryClient.cancelQueries({ queryKey: countsKey }),
      ]);
      const previous = {
        list: queryClient.getQueryData(listKey),
        counts: queryClient.getQueryData(countsKey),
      };
      queryClient.setQueryData(listKey, (list) =>
        list?.map((notification) => ({ ...notification, read: true })),
      );
      queryClient.setQueryData(countsKey, (counts) =>
        counts ? { ...counts, unreadNotifications: 0 } : counts,
      );
      return previous;
    },
    onError: (_error, _variables, previous) => {
      queryClient.setQueryData(listKey, previous?.list);
      queryClient.setQueryData(countsKey, previous?.counts);
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: listKey }),
        queryClient.invalidateQueries({ queryKey: countsKey }),
      ]),
  });
}
