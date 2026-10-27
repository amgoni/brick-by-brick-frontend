"use client";

import { useLayoutEffect } from "react";
import { notifyThemeChange } from "@/hooks/use-theme";
import {
  applyTheme,
  DARK_MEDIA_QUERY,
  readThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
} from "@/lib/theme";

/**
 * Keeps the applied theme right after the first paint, which the inline
 * script in app/layout.tsx has already got right:
 *
 * - Re-applies it on mount. In development, Strict Mode remounts the tree and
 *   resets <html> to the attributes React manages, wiping the one the script
 *   set. (Production never remounts; this is then a no-op.)
 * - Follows the OS when the preference is "system" and the OS switches, at
 *   sunset say.
 * - Follows another tab that changed it.
 *
 * Mounted once, in the root layout. Renders nothing.
 */
export function ThemeSync() {
  useLayoutEffect(() => {
    const sync = () => {
      applyTheme(resolveTheme(readThemePreference()));
      notifyThemeChange();
    };
    sync();

    const media = window.matchMedia(DARK_MEDIA_QUERY);
    const onStorage = (event: StorageEvent) => {
      // `key` is null when another tab cleared storage altogether.
      if (event.key === THEME_STORAGE_KEY || event.key === null) sync();
    };
    media.addEventListener("change", sync);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return null;
}
