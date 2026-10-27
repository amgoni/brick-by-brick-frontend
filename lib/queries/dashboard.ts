import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "@/lib/api/dashboard";

export const dashboardQueries = {
  all: () => ["dashboard"] as const,
  summary: () =>
    queryOptions({
      queryKey: [...dashboardQueries.all(), "summary"],
      queryFn: ({ signal }) => getDashboardSummary({ signal }),
    }),
};

export const useDashboardSummary = () => useSuspenseQuery(dashboardQueries.summary());
