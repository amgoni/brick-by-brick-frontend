import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listSuppliers } from "@/lib/api/suppliers";

export const supplierQueries = {
  all: () => ["suppliers"] as const,
  list: () =>
    queryOptions({
      queryKey: [...supplierQueries.all(), "list"],
      queryFn: ({ signal }) => listSuppliers({ signal }),
      staleTime: 5 * 60_000,
    }),
};

export const useSuppliers = () => useSuspenseQuery(supplierQueries.list());
