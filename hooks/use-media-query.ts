"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Whether a media query matches, kept live.
 *
 * `false` on the server and during hydration (there's no viewport there), so
 * the first paint is the mobile layout and desktop switches over straight
 * after. Lay things out with CSS (`md:` classes) wherever you can, and keep
 * this for behaviour CSS can't express: which side a sheet opens from, or
 * whether to render a table or a list.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** At or above the design's 860px breakpoint (`md:` in Tailwind here). */
export function useIsDesktop(): boolean {
  return useMediaQuery("(width >= 53.75rem)");
}
