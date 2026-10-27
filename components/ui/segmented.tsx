"use client";

import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";

interface SegmentedProps extends Omit<
  React.ComponentProps<typeof ToggleGroupPrimitive.Root>,
  "type" | "value" | "defaultValue" | "onValueChange"
> {
  value: string;
  onValueChange: (value: string) => void;
}

/**
 * A compact switch between views of the same thing: 6 months / 12 months on a
 * chart, list / board on a page. For switching between different panels of
 * content, use Tabs.
 *
 * Like ChipGroup, it never lets you deselect the current option.
 */
export function Segmented({ value, onValueChange, className, ...props }: SegmentedProps) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="segmented"
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(next);
      }}
      className={cn(
        // w-fit: a flex column would otherwise stretch it across the row.
        "inline-flex w-fit items-center gap-0.5 rounded-lg border border-line-strong p-0.5",
        className,
      )}
      {...props}
    />
  );
}

export function SegmentedItem({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="segmented-item"
      className={cn(
        "inline-flex h-9.5 items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 text-sm font-medium whitespace-nowrap text-ink-3 transition-colors md:h-7.5",
        "hover:text-ink disabled:pointer-events-none disabled:opacity-50",
        "data-[state=on]:border-line-strong data-[state=on]:text-ink",
        className,
      )}
      {...props}
    />
  );
}
