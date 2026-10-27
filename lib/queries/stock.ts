import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listStock, type ListStockParams } from "@/lib/api/stock";

export const stockQueries = {
  all: () => ["stock"] as const,
  levels: (params: ListStockParams = {}) =>
    queryOptions({
      queryKey: [...stockQueries.all(), "levels", params],
      queryFn: ({ signal }) => listStock(params, { signal }),
    }),
};

export const useStockLevels = (params?: ListStockParams) =>
  useSuspenseQuery(stockQueries.levels(params));
