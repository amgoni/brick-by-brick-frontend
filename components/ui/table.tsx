import { cn } from "@/lib/cn";

/**
 * A plain, semantic table styled to the design: 40px header, 56px rows,
 * hairline rules, rows that highlight on hover.
 *
 * It scrolls sideways inside its container rather than squeezing columns.
 * On a phone a wide table usually wants to become a list instead, which is a
 * per-page decision, not this component's.
 *
 * Cells are 8px apart either side (16px between columns) and 18px from the
 * card edge, matching the card's own padding.
 */
export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom border-collapse text-md", className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn(className)} {...props} />;
}

export function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(
        "[&>tr]:transition-colors [&>tr:hover]:bg-hover [&>tr:last-child]:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

export function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("border-t border-line-strong font-semibold [&>tr]:border-b-0", className)}
      {...props}
    />
  );
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn("border-b border-line data-[state=selected]:bg-hover", className)}
      {...props}
    />
  );
}

interface CellProps {
  /** Right-aligned with tabular figures, so money and quantities line up. */
  numeric?: boolean;
}

export function TableHead({
  className,
  numeric,
  ...props
}: React.ComponentProps<"th"> & CellProps) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle text-xs font-medium whitespace-nowrap text-ink-3 first:pl-4.5 last:pr-4.5",
        numeric && "text-right",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  numeric,
  ...props
}: React.ComponentProps<"td"> & CellProps) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "h-14 px-2 align-middle first:pl-4.5 last:pr-4.5",
        numeric && "text-right tabular-nums",
        className,
      )}
      {...props}
    />
  );
}

export function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("px-4.5 py-3 text-left text-sm text-ink-3", className)}
      {...props}
    />
  );
}
