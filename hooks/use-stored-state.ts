"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
/** Where values live when localStorage refuses them (private mode, storage full). */
const memory = new Map<string, string>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed it.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

/**
 * A small preference remembered in this browser, such as whether a list shows
 * cards or a table. Only for conveniences: it's per device, the user can clear
 * it, and the server never sees it. Anything that has to persist belongs in
 * the API.
 *
 * Only values in `allowed` are accepted, so a stale or hand-edited entry falls
 * back to `fallback`. The server renders with `fallback` too; the browser
 * re-renders with the stored value straight after hydration, with no mismatch
 * (the same arrangement as useTheme).
 */
export function useStoredState<T extends string>(
  key: string,
  fallback: T,
  allowed: readonly T[],
): [T, (value: T) => void] {
  const stored = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const value =
    stored !== null && (allowed as readonly string[]).includes(stored) ? (stored as T) : fallback;

  const setValue = useCallback(
    (next: T) => {
      memory.set(key, next);
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // Kept in memory for this visit instead.
      }
      for (const listener of listeners) listener();
    },
    [key],
  );

  return [value, setValue];
}
