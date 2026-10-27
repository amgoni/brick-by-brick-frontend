"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  applyTheme,
  readAppliedTheme,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
  type Theme,
  type ThemePreference,
} from "@/lib/theme";

/*
 * The theme already lives outside React (localStorage plus an attribute on
 * <html>), so this is an external store rather than context: no provider to
 * mount, and every `useTheme` caller re-renders when anything changes it.
 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Tell every `useTheme` caller to re-read. Called by `setTheme` and `ThemeSync`. */
export function notifyThemeChange(): void {
  for (const listener of listeners) listener();
}

export interface UseTheme {
  /** What the user chose: light, dark, or follow the system. */
  preference: ThemePreference;
  /** What's on screen now. */
  theme: Theme;
  setTheme: (preference: ThemePreference) => void;
  /** Flip between light and dark (leaving "system" behind). */
  toggleTheme: () => void;
}

/**
 * The server can't know the theme, so its snapshots are "system" and
 * "light". React renders with those during hydration, then re-renders with the
 * real values, so there's no hydration error. Anything purely visual should
 * still switch on the `dark:` variant or the tokens, not on `theme`, so it's
 * right from the first paint.
 */
export function useTheme(): UseTheme {
  const preference = useSyncExternalStore(subscribe, readThemePreference, () => "system" as const);
  const theme = useSyncExternalStore(subscribe, readAppliedTheme, () => "light" as const);

  const setTheme = useCallback((next: ThemePreference) => {
    writeThemePreference(next);
    applyTheme(resolveTheme(next));
    notifyThemeChange();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(readAppliedTheme() === "dark" ? "light" : "dark");
  }, [setTheme]);

  return { preference, theme, setTheme, toggleTheme };
}
