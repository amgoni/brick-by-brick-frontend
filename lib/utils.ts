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

/** A number typed into a form ("1250.5") as a number; null when it's empty or isn't one. */
export function parseNumber(value: string): number | null {
  if (value.trim() === "" || value === ".") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
