import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

/**
 * Status: a coloured outline, a dot, and words. The label is required, so a
 * status never depends on telling green from amber.
 *
 * Map domain states to tones in the module that owns them (a project's
 * "At risk" is `warning`), not here.
 */
export const badgeVariants = cva(
  [
    "inline-flex h-5.5 shrink-0 items-center gap-1.5 rounded-full border px-2 text-xs font-medium whitespace-nowrap",
    "before:size-1.5 before:shrink-0 before:rounded-full before:bg-current",
  ],
  {
    variants: {
      tone: {
        success: "border-success/40 text-success",
        warning: "border-warning/40 text-warning",
        danger: "border-danger/40 text-danger",
        info: "border-accent/40 text-accent",
        neutral: "border-line-strong text-ink-3",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export interface BadgeProps
  extends Omit<React.ComponentProps<"span">, "children">, VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />;
}

/** A neutral label: a trade, a category, a role. Not a status, so no colour and no dot. */
export function Tag({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="tag"
      className={cn(
        "inline-flex h-5.5 shrink-0 items-center gap-1.5 rounded-md border border-line-strong px-2 text-xs whitespace-nowrap text-ink-2 [&_svg]:size-3",
        className,
      )}
      {...props}
    />
  );
}

interface CountProps extends Omit<React.ComponentProps<"span">, "children"> {
  value: number;
  /** Show "0" instead of nothing. */
  showZero?: boolean;
}

/**
 * A number in a small pill, beside a nav link or a tab label. Renders nothing
 * at zero, because an empty queue should be quiet, so call sites can stay
 * unconditional.
 */
export function Count({ value, showZero = false, className, ...props }: CountProps) {
  if (value === 0 && !showZero) return null;
  return (
    <span
      data-slot="count"
      className={cn(
        "inline-flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full border border-line-strong px-1.5 text-2xs text-ink-3 tabular-nums",
        className,
      )}
      {...props}
    >
      {formatNumber(value)}
    </span>
  );
}
