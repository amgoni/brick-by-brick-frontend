import { isServer, QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data counts as fresh for 30s: going back to a page within that shows
        // the cache straight away, with no refetch. After that it refetches in
        // the background (on mount, on window focus) while still showing it.
        staleTime: 30_000,
        // A 4xx means the request was wrong; sending it again won't fix it.
        // Anything else (offline, a 503) gets two more tries, which matters
        // on a patchy mobile connection on site.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.isClientError) && failureCount < 2,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * One cache for the whole browser session; a fresh one for every server
 * render, so one user's data can never leak into another's. (Next's
 * TanStack Query guide, "Set up the provider".)
 */
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
