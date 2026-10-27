import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { search } from "@/lib/api/search";

/** Below this many characters a search is too vague to be worth a request. */
export const MIN_SEARCH_LENGTH = 2;

export const searchQueries = {
  all: () => ["search"] as const,
  results: (q: string) =>
    queryOptions({
      queryKey: [...searchQueries.all(), q],
      queryFn: ({ signal }) => search(q, { signal }),
      enabled: q.length >= MIN_SEARCH_LENGTH,
      // Keep the last results on screen while the next ones load, instead of
      // flashing empty on every keystroke.
      placeholderData: keepPreviousData,
      staleTime: 60_000,
    }),
};
