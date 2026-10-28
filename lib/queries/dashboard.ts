import { queryOptions, useSuspenseQuery, type QueryClient } from "@tanstack/react-query";
import { getDashboardSummary } from "@/lib/api/dashboard";
import { meQueries } from "@/lib/queries/me";

export const dashboardQueries = {
  all: () => ["dashboard"] as const,
  summary: () =>
    queryOptions({
      queryKey: [...dashboardQueries.all(), "summary"],
      queryFn: ({ signal }) => getDashboardSummary({ signal }),
    }),
};

export const useDashboardSummary = () => useSuspenseQuery(dashboardQueries.summary());

/**
 * After anything is approved or rejected: the counts of what's waiting live in
 * the dashboard summary and in the navigation's badges, so both refetch.
 */
export function refreshApprovalCounts(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: dashboardQueries.all() }),
    queryClient.invalidateQueries({ queryKey: meQueries.counts().queryKey }),
  ]);
}
