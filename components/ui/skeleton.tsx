import { cn } from "@/lib/cn";

/**
 * A placeholder block while content loads. Size it like what it stands in for,
 * so nothing jumps when the real content arrives.
 *
 * A <span> (made a block), so it's also valid where only text may go: inside
 * a page title's <h1> or a description's <p>.
 */
export function Skeleton({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("block animate-pulse rounded-md bg-line", className)}
      {...props}
    />
  );
}

/** Stand-in for a Table: a header row and `rows` 56px rows. */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div data-slot="table-skeleton" aria-hidden="true">
      <div className="flex h-10 items-center gap-4 border-b border-line px-4.5">
        {Array.from({ length: columns }, (_, column) => (
          <Skeleton key={column} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div
          key={row}
          className="flex h-14 items-center gap-4 border-b border-line px-4.5 last:border-b-0"
        >
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton key={column} className={cn("h-3.5 flex-1", column === 0 && "flex-[2]")} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Stand-in for a List: `rows` rows of an icon square and two lines of text. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div data-slot="list-skeleton" aria-hidden="true">
      {Array.from({ length: rows }, (_, row) => (
        <div
          key={row}
          className="flex items-center gap-3 border-b border-line px-4.5 py-3.5 last:border-b-0"
        >
          <Skeleton className="size-8.5 shrink-0 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
