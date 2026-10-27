import { cn } from "@/lib/cn";

interface PageHeaderProps {
  title: React.ReactNode;
  /** Above the title, quieter: "Monday, 26 October 2026". */
  eyebrow?: React.ReactNode;
  /** Beside the title, outside the heading: a status badge, a tag. */
  status?: React.ReactNode;
  description?: React.ReactNode;
  /** A row of facts under the title, on a record's page: where, when, who. */
  meta?: React.ReactNode;
  /** Buttons on the right. At most one of them `primary`. */
  actions?: React.ReactNode;
  /** A Breadcrumb, on detail pages. */
  breadcrumb?: React.ReactNode;
  className?: string;
}

/** The top of every page: where you are, and what you can do here. */
export function PageHeader({
  title,
  eyebrow,
  status,
  description,
  meta,
  actions,
  breadcrumb,
  className,
}: PageHeaderProps) {
  return (
    <header data-slot="page-header" className={cn("flex flex-col gap-3", className)}>
      {breadcrumb}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="mb-1.5 text-sm text-ink-3">{eyebrow}</p>}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-3xl font-semibold">{title}</h1>
            {status}
          </div>
          {description && <p className="mt-1.5 max-w-[78ch] text-md text-ink-3">{description}</p>}
          {meta && (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4.5 gap-y-1.5 text-md text-ink-2">
              {meta}
            </div>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
