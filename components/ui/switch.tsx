"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import { useFieldControl } from "@/components/ui/field";
import { cn } from "@/lib/cn";

/**
 * An on/off setting that applies straight away. Outlined like everything else:
 * off is an empty track, on is an accent track with a filled knob.
 *
 * The visible switch is 26px tall, but its tap target extends to 46px (the
 * `after:` layer), so it clears the 44px touch minimum without looking chunky.
 */
export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  const field = useFieldControl();
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      {...field}
      className={cn(
        "relative inline-flex h-6.5 w-11 shrink-0 items-center rounded-full border-[1.5px] border-line-strong bg-transparent transition-colors",
        "after:absolute after:inset-x-0 after:-inset-y-2.5",
        "disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-accent",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-4.25 translate-x-0.75 rounded-full border-[1.5px] border-ink-3 bg-surface transition-[translate,background-color,border-color]",
          "data-[state=checked]:translate-x-5.25 data-[state=checked]:border-data data-[state=checked]:bg-data",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
