"use client";

import { Check, Minus } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { useFieldControl } from "@/components/ui/field";
import { cn } from "@/lib/cn";

/**
 * 18px, navy when ticked. Supports `checked="indeterminate"` for a "select
 * all" whose rows are partly selected. Pair it with a label that wraps it, so
 * the text is part of the tap target:
 *
 *   <label className="flex items-center gap-2.5"><Checkbox /> Remember me</label>
 */
export function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  const field = useFieldControl();
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      {...field}
      className={cn(
        "group inline-flex size-4.5 shrink-0 items-center justify-center rounded-[5px] border-[1.5px] border-line-strong bg-transparent text-on-primary transition-colors",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary",
        "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <Check className="hidden size-3.5 stroke-3 group-data-[state=checked]:block" />
        <Minus className="hidden size-3.5 stroke-3 group-data-[state=indeterminate]:block" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
