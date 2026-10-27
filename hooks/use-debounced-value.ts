"use client";

import { useEffect, useState } from "react";

/**
 * Quiet period for a search box that drives a request: long enough that typing
 * a name is one query rather than eight, short enough that the list still feels
 * like it's keeping up.
 */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * The value, held back until it has stopped changing for `delay` ms.
 *
 * Use this, not `useDeferredValue`, whenever the value feeds a network
 * request. `useDeferredValue` only deprioritises the render; it never withholds
 * the value, so a query keyed on a deferred search term still fires once per
 * keystroke. Filtering a list that's already in memory needs neither.
 */
export function useDebouncedValue<T>(value: T, delay: number = SEARCH_DEBOUNCE_MS): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return settled;
}
