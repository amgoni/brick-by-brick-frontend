/**
 * Initials for an avatar: "Adaeze Okafor" → "AO", "chinedu" → "C",
 * "ibrahim.musa@site.ng" → "IM". "?" when there's nothing to go on.
 */
export function getInitials(input?: string | null): string {
  if (!input) return "?";
  const base = input.includes("@") ? input.split("@")[0]! : input;
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("");
  return initials.toUpperCase() || "?";
}

/** "today" → "Today", for words that open a line. */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
