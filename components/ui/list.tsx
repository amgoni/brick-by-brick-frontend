import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Rows divided by hairlines, the design's workhorse inside cards: "Needs
 * attention", "Upcoming milestones", "Latest site reports".
 *
 *   <List>
 *     <ListItem>
 *       <ListItemIcon className="text-warning"><TriangleAlert /></ListItemIcon>
 *       <ListItemContent>
 *         <ListItemTitle>Cement 42.5R running low</ListItemTitle>
 *         <ListItemDescription>Lekki Palms store · 38 bags</ListItemDescription>
 *       </ListItemContent>
 *       <Button size="sm">Reorder</Button>
 *     </ListItem>
 *   </List>
 */
export function List({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="list" className={cn("flex flex-col", className)} {...props} />;
}

const rowClasses = "flex items-center gap-3 px-4.5 py-3.5";

interface ListItemProps extends React.ComponentProps<"li"> {
  /** Makes the whole row a link (it stays an <li>, with the link inside). */
  href?: string;
}

export function ListItem({ href, className, children, ...props }: ListItemProps) {
  if (href) {
    return (
      <li data-slot="list-item" className="border-b border-line last:border-b-0" {...props}>
        <Link href={href} className={cn(rowClasses, "transition-colors hover:bg-hover", className)}>
          {children}
        </Link>
      </li>
    );
  }
  return (
    <li
      data-slot="list-item"
      className={cn(rowClasses, "border-b border-line last:border-b-0", className)}
      {...props}
    >
      {children}
    </li>
  );
}

/** A 34px outlined square holding an icon. Colour it to carry a status. */
export function ListItemIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="list-item-icon"
      className={cn(
        "inline-flex size-8.5 shrink-0 items-center justify-center rounded-lg border border-line text-ink-2",
        className,
      )}
      {...props}
    />
  );
}

export function ListItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="list-item-content" className={cn("min-w-0 flex-1", className)} {...props} />
  );
}

export function ListItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="list-item-title"
      className={cn("text-md font-medium text-ink", className)}
      {...props}
    />
  );
}

export function ListItemDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="list-item-description"
      className={cn("mt-0.5 text-sm text-ink-3", className)}
      {...props}
    />
  );
}
