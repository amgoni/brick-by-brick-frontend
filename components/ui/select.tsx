"use client";

import { ChevronDown } from "lucide-react";
import { useFieldControl } from "@/components/ui/field";
import { controlClasses } from "@/components/ui/input";
import { cn } from "@/lib/cn";

/**
 * A native <select>, styled like an input.
 *
 * Native on purpose, as in the design: on a phone it opens the OS picker,
 * which beats any custom dropdown for someone on site with gloves on, and it
 * works in a plain form with no JavaScript. When a list is too long to scroll
 * (200 suppliers), that's a job for a searchable combobox, not this.
 *
 * `className` sizes the box (`w-60`); every other prop goes to the <select>.
 */
export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  const field = useFieldControl();
  return (
    <div data-slot="select" className={cn("relative w-full min-w-0", className)}>
      <select
        {...field}
        className={cn(controlClasses, "h-control appearance-none bg-surface pr-9 pl-3")}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-3"
      />
    </div>
  );
}
