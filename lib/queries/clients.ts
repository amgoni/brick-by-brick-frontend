import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listClients } from "@/lib/api/clients";

export const clientQueries = {
  all: () => ["clients"] as const,
  list: () =>
    queryOptions({
      queryKey: [...clientQueries.all(), "list"],
      queryFn: ({ signal }) => listClients({ signal }),
      staleTime: 5 * 60_000,
    }),
};

export const useClients = () => useSuspenseQuery(clientQueries.list());
