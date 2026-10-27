import { cn } from "@/lib/cn";

interface DescriptionListProps extends React.ComponentProps<"dl"> {
  /**
   * `row` puts each label to the left of its value (a record's details).
   * `grid` puts labels above values, two or three across (an asset's facts).
   */
  layout?: "row" | "grid";
  /** Width of the label column in `row` layout. */
  termWidth?: string;
}

/**
 * Label/value pairs.
 *
 *   <DescriptionList>
 *     <DescriptionItem label="Client">Crestview Holdings</DescriptionItem>
 *     <DescriptionItem label="Due">12 Nov 2026</DescriptionItem>
 *   </DescriptionList>
 *
 * In `row` layout each item is a subgrid row, so every label column lines up
 * however long the values get.
 */
export function DescriptionList({
  layout = "row",
  termWidth = "7.5rem",
  className,
  style,
  ...props
}: DescriptionListProps) {
  return (
    <dl
      data-slot="description-list"
      style={{ "--dl-term": termWidth, ...style } as React.CSSProperties}
      className={cn(
        "grid text-md [&_dd]:min-w-0 [&_dd]:wrap-break-word [&_dt]:text-ink-3",
        layout === "row"
          ? "grid-cols-[var(--dl-term)_minmax(0,1fr)] gap-x-3 gap-y-2.5 [&>div]:col-span-2 [&>div]:grid [&>div]:grid-cols-subgrid"
          : "grid-cols-2 gap-x-4 gap-y-3.5 md:grid-cols-3 [&_dd]:mt-0.5 [&_dd]:font-medium [&_dt]:text-sm",
        className,
      )}
      {...props}
    />
  );
}

interface DescriptionItemProps extends React.ComponentProps<"div"> {
  label: React.ReactNode;
}

export function DescriptionItem({ label, children, ...props }: DescriptionItemProps) {
  return (
    <div data-slot="description-item" {...props}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
