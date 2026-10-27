"use client";

import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

interface ChipGroupProps extends Omit<
  React.ComponentProps<typeof ToggleGroupPrimitive.Root>,
  "type" | "value" | "defaultValue" | "onValueChange"
> {
  value: string;
  onValueChange: (value: string) => void;
}

/**
 * Filter chips, one active at a time: All 8 · Active 5 · On hold 1.
 *
 * A single-select Radix toggle group, which Radix exposes as a radio group:
 * arrow keys move between the chips and the active one is announced as
 * checked. Clicking the active chip again does nothing; a bare toggle group
 * would deselect it and leave no filter at all.
 *
 * Chips wrap by default. For a single scrolling row on a phone, pass
 * `className="flex-nowrap overflow-x-auto scrollbar-none"`.
 */
export function ChipGroup({ value, onValueChange, className, ...props }: ChipGroupProps) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="chip-group"
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(next);
      }}
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

interface ChipProps extends React.ComponentProps<typeof ToggleGroupPrimitive.Item> {
  /** How many rows the filter matches. Shown even at 0: an empty filter is worth knowing about. */
  count?: number;
}

export function Chip({ className, count, children, ...props }: ChipProps) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="chip"
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-line px-3 text-md font-medium whitespace-nowrap text-ink-2 transition-colors md:h-8.5",
        "hover:border-line-strong disabled:pointer-events-none disabled:opacity-50",
        "data-[state=on]:border-accent data-[state=on]:text-ink data-[state=on]:inset-ring data-[state=on]:inset-ring-accent",
        className,
      )}
      {...props}
    >
      {children}
      {count !== undefined && (
        <span className="text-xs text-ink-3 tabular-nums">{formatNumber(count)}</span>
      )}
    </ToggleGroupPrimitive.Item>
  );
}
