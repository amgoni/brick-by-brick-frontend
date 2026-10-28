"use client";

import { useState } from "react";
import { useFieldControl } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { parseNumber } from "@/lib/utils";

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

interface NumberInputProps extends Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "defaultValue" | "onChange" | "inputMode" | "prefix"
> {
  /** The number as typed: "1250.5", or "" when empty. */
  value: string;
  onValueChange: (value: string) => void;
  /** Digits allowed after the point; 0 for whole numbers. */
  decimals?: number;
  /** Before the number: "₦". */
  prefix?: React.ReactNode;
  /** After it: "bags". */
  suffix?: React.ReactNode;
}

/**
 * A number field that only takes a number. Keystrokes that would make it
 * anything else (a letter, a second point, a third decimal) are refused, so
 * there's nothing to correct later. While it has focus it shows what was
 * typed; when it loses focus the thousands get their commas (12,500).
 *
 * The value stays a string while it's edited, because "12." is a fine thing
 * to have typed on the way to "12.5". Turn it into a number with
 * `parseNumber` (lib/utils) when the form is submitted.
 */
export function NumberInput({
  value,
  onValueChange,
  decimals = 0,
  prefix,
  suffix,
  className,
  onFocus,
  onBlur,
  ...props
}: NumberInputProps) {
  const [focused, setFocused] = useState(false);
  const pattern = new RegExp(`^\\d*${decimals > 0 ? `(\\.\\d{0,${decimals}})?` : ""}$`);
  const inputProps = {
    ...props,
    type: "text",
    inputMode: decimals > 0 ? ("decimal" as const) : ("numeric" as const),
    autoComplete: "off",
    value:
      focused || parseNumber(value) === null ? value : formatNumber(Number(value), { decimals }),
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value.replace(/[,\s]/g, "");
      if (pattern.test(next)) onValueChange(next);
    },
    onFocus: (event: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      onFocus?.(event);
    },
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      onBlur?.(event);
    },
  };

  if (!prefix && !suffix) {
    return <Input {...inputProps} className={cn("tabular-nums", className)} />;
  }
  return (
    <InputGroup className={className}>
      {prefix && <InputGroupAddon>{prefix}</InputGroupAddon>}
      <InputGroupInput {...inputProps} className="tabular-nums" />
      {suffix && <InputGroupAddon>{suffix}</InputGroupAddon>}
    </InputGroup>
  );
}

/** A naira amount, to the kobo. */
export function MoneyInput(props: Omit<NumberInputProps, "prefix" | "decimals">) {
  return <NumberInput prefix="₦" decimals={2} {...props} />;
}
