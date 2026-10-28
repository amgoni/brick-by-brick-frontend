"use client";

import { Toggle as TogglePrimitive } from "radix-ui";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

interface ToggleProps extends React.ComponentProps<typeof TogglePrimitive.Root> {
  /** How many rows it would leave, shown beside the label. */
  count?: number;
}

/**
 * A button that stays pressed: a filter you switch on and off, like "Below
 * reorder level". Control height, so it sits level with the inputs beside it;
 * pressed, it takes the accent outline a selected chip has. Screen readers
 * hear it as a toggle button, pressed or not.
 */
export function Toggle({ className, count, children, ...props }: ToggleProps) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(
        buttonVariants({ size: "md" }),
        "text-ink-2 data-[state=on]:border-accent data-[state=on]:text-ink data-[state=on]:inset-ring data-[state=on]:inset-ring-accent",
        className,
      )}
      {...props}
    >
      {children}
      {count !== undefined && (
        <span className="text-xs text-ink-3 tabular-nums">{formatNumber(count)}</span>
      )}
    </TogglePrimitive.Root>
  );
}
