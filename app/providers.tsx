"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserOnly } from "@/components/ui/browser-only";
import { getQueryClient } from "@/lib/queries/query-client";

/**
 * The client-side providers, mounted once in the root layout. A Client
 * Component so the layout itself can stay a Server Component.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
      {/* Development only: inspect the cache, queries and refetches. Bottom-left,
          because toasts own the bottom-right corner. */}
      {process.env.NODE_ENV === "development" && (
        <BrowserOnly fallback={null}>
          <ReactQueryDevtools buttonPosition="bottom-left" />
        </BrowserOnly>
      )}
    </QueryClientProvider>
  );
}
