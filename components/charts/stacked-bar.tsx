import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

export interface StackedBarSegment {
  key: string;
  label: string;
  value: number;
  /**
   * Strongest first, for categories with an order to them (sold → reserved →
   * leased). "outline" is for the remainder: what's still available.
   */
  shade: "full" | "strong" | "soft" | "outline";
}

/*
 * Tints of the one data colour, checked with the dataviz skill's palette
 * validator against both surfaces: monotone lightness, clear steps between
 * neighbours, and the softest still 2.28:1 on white and 2.49:1 on the dark
 * surface. A lighter "soft" (28%) failed, at 1.69:1, and would vanish.
 */
const SHADES: Record<StackedBarSegment["shade"], string> = {
  full: "bg-data",
  strong: "bg-data/62",
  soft: "bg-data/40",
  outline: "border-[1.5px] border-line-strong",
};

interface StackedBarProps {
  segments: StackedBarSegment[];
  formatValue?: (value: number) => string;
  className?: string;
}

/**
 * Part of a whole in one bar, with a legend that carries every value. The
 * legend is what's read out (the bar is hidden from assistive tech), so no
 * value is only available as a shade of colour.
 */
export function StackedBar({ segments, formatValue = formatNumber, className }: StackedBarProps) {
  return (
    <div data-slot="stacked-bar" className={cn("flex flex-col gap-3.5", className)}>
      <div aria-hidden="true" className="flex h-3 gap-0.5">
        {segments
          .filter((segment) => segment.value > 0)
          .map((segment) => (
            <span
              key={segment.key}
              title={`${segment.label}: ${formatValue(segment.value)}`}
              className={cn("min-w-1 basis-0 rounded-[3px]", SHADES[segment.shade])}
              style={{ flexGrow: segment.value }}
            />
          ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-md">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn("h-2.5 w-3.5 shrink-0 rounded-[3px]", SHADES[segment.shade])}
            />
            <span className="flex-1 text-ink-2">{segment.label}</span>
            <span className="font-medium tabular-nums">{formatValue(segment.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
