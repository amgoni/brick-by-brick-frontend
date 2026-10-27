import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getCashFlow } from "@/lib/api/reports";

export const reportQueries = {
  all: () => ["reports"] as const,
  cashFlow: (months: number) =>
    queryOptions({
      queryKey: [...reportQueries.all(), "cash-flow", { months }],
      queryFn: ({ signal }) => getCashFlow({ months }, { signal }),
    }),
};

export const useCashFlow = (months: number) => useSuspenseQuery(reportQueries.cashFlow(months));
