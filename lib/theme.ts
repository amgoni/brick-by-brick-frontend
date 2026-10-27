/**
 * Light / dark theme.
 *
 * The applied theme is a `data-theme` attribute on <html>, which is what
 * app/globals.css keys its tokens off. The user's *preference* is one of
 * light, dark or system, and lives in localStorage; "system" (the default)
 * follows the OS.
 *
 * localStorage rather than a cookie, deliberately: a cookie would let the
 * server render the right theme, but reading cookies in the root layout makes
 * every route dynamic, and under Cache Components blocks every segment beneath
 * it. Instead `THEME_INIT_SCRIPT` runs in <head> before first paint, so there's
 * no flash and the pages stay static. (Next's guide: "Preventing flash before
 * hydration".)
 */

export const THEME_STORAGE_KEY = "bbb-theme";
export const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

export const THEME_PREFERENCES = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type Theme = Exclude<ThemePreference, "system">;

export function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    // Storage blocked (private mode, a locked-down browser): follow the OS.
    return "system";
  }
}

export function writeThemePreference(preference: ThemePreference): void {
  try {
    if (preference === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Not persisted; the choice still applies for this page view.
  }
}

export function resolveTheme(preference: ThemePreference): Theme {
  if (preference !== "system") return preference;
  return window.matchMedia(DARK_MEDIA_QUERY).matches ? "dark" : "light";
}

export function readAppliedTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

/**
 * readThemePreference → resolveTheme → applyTheme, inlined into <head> by
 * app/layout.tsx so it runs during HTML parsing, before anything is painted.
 * Keep it in step with those three.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var d=p==="dark"||(p!=="light"&&window.matchMedia(${JSON.stringify(
  DARK_MEDIA_QUERY,
)}).matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}})()`;
