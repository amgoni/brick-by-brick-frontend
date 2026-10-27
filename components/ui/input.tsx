"use client";

import { useFieldControl } from "@/components/ui/field";
import { cn } from "@/lib/cn";

/**
 * The look every text-like control shares (Input, Textarea, Select): a
 * line-strong outline, and on focus an accent border with a 3px halo in
 * place of the global focus outline, as the design draws it.
 *
 * Text is 16px on phones and 13.5px from the breakpoint up. Below 16px, iOS
 * Safari zooms the whole page when the field is focused.
 */
export const controlClasses = cn(
  "w-full min-w-0 rounded-lg border border-line-strong bg-transparent text-lg text-ink transition-[border-color,box-shadow] md:text-md",
  "outline-hidden focus:border-accent focus:ring-3 focus:ring-ring",
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-3",
  "aria-invalid:border-danger aria-invalid:focus:ring-danger/20",
);

/**
 * A single-line text input. Read-only inputs get a dashed border (a figure
 * the form works out, like an invoice line total), so "can't edit this" is
 * visible before anyone tries.
 */
export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  const field = useFieldControl();
  return (
    <input
      data-slot="input"
      type={type}
      {...field}
      className={cn(
        controlClasses,
        "h-control px-3 read-only:border-dashed read-only:text-ink-2",
        "file:mr-3 file:border-0 file:bg-transparent file:font-medium file:text-ink",
        className,
      )}
      {...props}
    />
  );
}

/**
 * An input with something attached: a search icon, a ₦ prefix, a unit
 * ("tonnes"), a clear button. The group draws the box and the focus halo; the
 * input inside is bare.
 *
 *   <InputGroup>
 *     <InputGroupAddon><Search /></InputGroupAddon>
 *     <InputGroupInput placeholder="Search item or SKU" />
 *   </InputGroup>
 *
 * Clicking a decorative addon (the icon, the unit) focuses the input, so the
 * whole box behaves like one field.
 */
export function InputGroup({ className, onMouseDown, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      onMouseDown={(event) => {
        onMouseDown?.(event);
        const target = event.target as HTMLElement;
        if (event.defaultPrevented || target.closest("input, button, a, select, textarea")) return;
        event.preventDefault();
        event.currentTarget.querySelector("input")?.focus();
      }}
      className={cn(
        "flex h-control w-full min-w-0 items-center rounded-lg border border-line-strong text-ink transition-[border-color,box-shadow]",
        "focus-within:border-accent focus-within:ring-3 focus-within:ring-ring",
        "has-aria-invalid:border-danger has-aria-invalid:focus-within:ring-danger/20",
        "has-disabled:cursor-not-allowed has-disabled:bg-surface-muted",
        className,
      )}
      {...props}
    />
  );
}

export function InputGroupInput({
  className,
  type = "text",
  ...props
}: React.ComponentProps<"input">) {
  const field = useFieldControl();
  return (
    <input
      data-slot="input-group-input"
      type={type}
      {...field}
      className={cn(
        "h-full min-w-0 flex-1 bg-transparent px-2 text-lg text-ink outline-hidden first:pl-3 last:pr-3 disabled:cursor-not-allowed md:text-md",
        className,
      )}
      {...props}
    />
  );
}

export function InputGroupAddon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="input-group-addon"
      className={cn(
        "flex h-full shrink-0 items-center gap-1.5 text-md text-ink-3 select-none first:pl-3 last:pr-3",
        "has-[button]:px-1",
        className,
      )}
      {...props}
    />
  );
}
