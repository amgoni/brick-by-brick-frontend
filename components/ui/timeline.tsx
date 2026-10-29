import { cn } from "@/lib/cn";

/**
 * What happened, in order: an invoice's activity, a record's history. Each
 * entry is a hollow dot on a hairline, a title, and a quieter line of when
 * and who.
 *
 *   <Timeline>
 *     <TimelineItem>
 *       <TimelineTitle>Second reminder sent</TimelineTitle>
 *       <TimelineMeta>21 Oct · Ngozi Ume</TimelineMeta>
 *     </TimelineItem>
 *   </Timeline>
 *
 * An ordered list, so a screen reader announces how many entries there are.
 * Newest first is the usual order for activity; the component doesn't mind.
 */
export function Timeline({ className, ...props }: React.ComponentProps<"ol">) {
  return <ol data-slot="timeline" className={cn("flex flex-col", className)} {...props} />;
}

export function TimelineItem({ className, children, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="timeline-item"
      className={cn(
        // The rail runs from under this dot to the next one; the last entry has none.
        "relative flex gap-3 pb-3.5 text-md last:pb-0",
        "before:absolute before:top-4.5 before:bottom-0 before:left-[4px] before:w-px before:bg-line-strong last:before:hidden",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="mt-1.5 size-2.25 shrink-0 rounded-full border-[1.5px] border-ink-3"
      />
      <div className="flex min-w-0 flex-col gap-0.5">{children}</div>
    </li>
  );
}

export function TimelineTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="timeline-title" className={cn("text-ink", className)} {...props} />;
}

export function TimelineMeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="timeline-meta" className={cn("text-sm text-ink-3", className)} {...props} />
  );
}
