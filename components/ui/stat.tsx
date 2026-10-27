import Link from "next/link";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Top-right, beside the label. */
  icon?: React.ReactNode;
  /** A line of context under the figure: a badge, "₦4.12bn billed to date · 48%". */
  footer?: React.ReactNode;
  /** Makes the whole tile a link to the page behind the number. */
  href?: string;
  className?: string;
}

/**
 * A KPI tile: label, the figure, and what it means.
 *
 * The figure uses proportional digits, not `tabular-nums`: tabular figures
 * give every digit the width of a 0, which makes a lone number like 121 look
 * loose at this size. Tabular is for numbers that line up in a column.
 */
export function StatCard({ label, value, icon, footer, href, className }: StatCardProps) {
  const classes = cn(
    "flex min-w-0 flex-col gap-2 rounded-xl border border-line bg-surface px-4.5 py-4 text-ink",
    href && "transition-colors hover:border-line-strong",
    className,
  );
  const content = (
    <>
      <div className="flex items-center justify-between gap-2 text-ink-3">
        <span className="text-sm font-medium">{label}</span>
        {icon}
      </div>
      <div className="text-4xl font-semibold">{value}</div>
      {footer && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-3">{footer}</div>
      )}
    </>
  );

  return href ? (
    <Link data-slot="stat-card" href={href} className={classes}>
      {content}
    </Link>
  ) : (
    <div data-slot="stat-card" className={classes}>
      {content}
    </div>
  );
}

/**
 * A row of figures in one box, divided by lines: an invoice's totals, a
 * site's budget. One row from the breakpoint up, stacked on phones.
 */
export function StatStrip({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stat-strip"
      className={cn("flex flex-col rounded-xl border border-line md:flex-row", className)}
      {...props}
    />
  );
}

interface StatProps {
  label: React.ReactNode;
  value: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export function Stat({ label, value, meta, className }: StatProps) {
  return (
    <div
      data-slot="stat"
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-1 border-line px-4.5 py-3.5",
        "not-last:border-b md:not-last:border-r md:not-last:border-b-0",
        className,
      )}
    >
      <span className="text-sm font-medium text-ink-3">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
      {/* A div, so it can hold a progress bar as well as a line of text. */}
      {meta && <div className="text-sm text-ink-3">{meta}</div>}
    </div>
  );
}
