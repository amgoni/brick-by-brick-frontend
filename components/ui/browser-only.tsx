"use client";

import { Suspense, use } from "react";
import { browser } from "react-dom";

function Defer({ reason, children }: { reason: string; children: React.ReactNode }) {
  use(browser(reason));
  return children;
}

interface BrowserOnlyProps {
  /** What the server renders in its place, and what shows until the browser takes over. */
  fallback: React.ReactNode;
  /** Why this can't render on the server. Diagnostic only: React reports it during SSR. */
  reason?: string;
  children: React.ReactNode;
}

/**
 * Renders `children` only in the browser; the server renders `fallback`.
 *
 * With Cache Components, Next prerenders Client Components too, and it guards
 * reading the clock (`new Date()`, `Date.now()`) during a prerender: a
 * component that does so outside a Suspense boundary fails the build. Anything
 * that depends on the current time, or on browser-only state, goes in here,
 * and its fallback becomes the static HTML.
 *
 * Built on React 19.3's `use(browser())`, which suspends to the boundary
 * below during SSR, so there's no hydration mismatch: the browser renders the
 * real content as if the server never tried.
 */
export function BrowserOnly({
  fallback,
  reason = "Depends on the browser: the clock, storage, or data fetched after hydration.",
  children,
}: BrowserOnlyProps) {
  return (
    <Suspense fallback={fallback}>
      <Defer reason={reason}>{children}</Defer>
    </Suspense>
  );
}
