"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * True on Apple platforms, for showing ⌘ rather than Ctrl in shortcut hints.
 * `null` on the server and during hydration (`navigator` is client-only), so a
 * hint can render nothing until it knows.
 */
export function useIsMac(): boolean | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent),
    () => null,
  );
}
