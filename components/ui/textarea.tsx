"use client";

import { useFieldControl } from "@/components/ui/field";
import { controlClasses } from "@/components/ui/input";
import { cn } from "@/lib/cn";

export function Textarea({ className, rows = 3, ...props }: React.ComponentProps<"textarea">) {
  const field = useFieldControl();
  return (
    <textarea
      data-slot="textarea"
      rows={rows}
      {...field}
      className={cn(
        controlClasses,
        "min-h-20 resize-y px-3 py-2.5 read-only:border-dashed read-only:text-ink-2",
        className,
      )}
      {...props}
    />
  );
}
