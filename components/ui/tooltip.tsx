"use client";

import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";

/**
 * A short label on hover or keyboard focus, mostly for icon-only buttons.
 * Phones have no hover, so a tooltip can never be the only place something
 * is said.
 *
 * `TooltipProvider` is mounted once in the root layout, so moving between
 * tooltips shows the next one straight away instead of waiting again.
 */
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-w-xs rounded-md bg-ink px-2 py-1 text-xs text-surface",
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
