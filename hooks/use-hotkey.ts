"use client";

import { useEffect, useEffectEvent } from "react";

interface HotkeyOptions {
  /** Off switch, for a shortcut that only applies in some states. */
  enabled?: boolean;
  /**
   * Fire even while the user is typing in a field. Off by default, so "/" in a
   * text box types a slash; on for chords like mod+k that never mean text.
   */
  allowInInputs?: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

/**
 * Parses "mod+k", "shift+/", "escape". `mod` is ⌘ on a Mac and Ctrl
 * everywhere else, so one binding reads right on both.
 */
function matches(event: KeyboardEvent, combo: string): boolean {
  const keys = combo.toLowerCase().split("+");
  const key = keys.pop();
  const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const wants = {
    meta: keys.includes("meta") || (isMac && keys.includes("mod")),
    ctrl: keys.includes("ctrl") || (!isMac && keys.includes("mod")),
    shift: keys.includes("shift"),
    alt: keys.includes("alt"),
  };
  return (
    event.key.toLowerCase() === key &&
    event.metaKey === wants.meta &&
    event.ctrlKey === wants.ctrl &&
    event.shiftKey === wants.shift &&
    event.altKey === wants.alt
  );
}

/**
 * A global keyboard shortcut: `useHotkey("mod+k", () => setOpen(true))`.
 *
 * The handler is an Effect Event, so it always sees the latest props and
 * state, and passing an inline function doesn't re-attach the listener on
 * every render.
 */
export function useHotkey(
  combo: string,
  handler: (event: KeyboardEvent) => void,
  { enabled = true, allowInInputs = false }: HotkeyOptions = {},
): void {
  const onHotkey = useEffectEvent(handler);

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || !matches(event, combo)) return;
      if (!allowInInputs && isTypingTarget(event.target)) return;
      event.preventDefault();
      onHotkey(event);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [combo, enabled, allowInInputs]);
}
