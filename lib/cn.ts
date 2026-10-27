import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's default theme, so the custom keys in
 * app/globals.css have to be registered here, or it can't tell which classes
 * conflict. Unregistered, `h-control` isn't recognised as a height:
 * `cn("h-control", "h-8")` keeps both, the stylesheet's order decides, and the
 * override at the call site silently loses.
 *
 * The type scale needs nothing (its steps are t-shirt sizes, which it already
 * reads as font sizes) and neither do colours (any `text-*` it doesn't know as
 * a size is taken as a colour).
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: ["control", "control-sm"],
      shadow: ["pop", "modal", "drawer"],
      container: ["content"],
      tracking: ["caps"],
    },
  },
});

/** Merge conditional class names and resolve Tailwind conflicts (last wins). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
