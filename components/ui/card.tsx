import { Children, isValidElement } from "react";
import { cn } from "@/lib/cn";

/**
 * A bordered panel.
 *
 * Unpadded, unlike Aku's: in this design almost every card is a header strip
 * over a full-bleed list or table, so padding belongs to the parts. Put a
 * List or Table straight in, and wrap anything else in CardContent.
 *
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>Active projects</CardTitle>
 *       <CardDescription>Progress against schedule and budget</CardDescription>
 *       <CardAction><Button size="sm">View all</Button></CardAction>
 *     </CardHeader>
 *     <Table>…</Table>
 *   </Card>
 */
export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("min-w-0 rounded-xl border border-line bg-surface", className)}
      {...props}
    />
  );
}

/**
 * Title and description stack on the left; a CardAction sits on the right
 * while there's room for it, and wraps underneath when there isn't. A
 * "View all" button stays beside the title on a phone; a period switch drops
 * below it rather than squeezing the title into a column of single words.
 *
 * That needs the title and description in a block of their own, so the
 * header gathers its non-action children into one. Call sites don't wrap them.
 */
export function CardHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  const items = Children.toArray(children);
  const isAction = (child: React.ReactNode) => isValidElement(child) && child.type === CardAction;
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-line px-4.5 py-3.5",
        className,
      )}
      {...props}
    >
      <div className="min-w-0 flex-[1_1_12rem]">{items.filter((child) => !isAction(child))}</div>
      {items.filter(isAction)}
    </div>
  );
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2 data-slot="card-title" className={cn("text-base font-semibold", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("mt-0.5 text-sm text-ink-3", className)}
      {...props}
    />
  );
}

export function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-4.5 py-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex flex-wrap items-center gap-2 border-t border-line px-4.5 py-3.5",
        className,
      )}
      {...props}
    />
  );
}
