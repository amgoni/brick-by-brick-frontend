import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  /** What to do about it: "Try a project, invoice number or stock item." */
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/** Nothing here yet, or nothing matches. Always say what to do next. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn("flex flex-col items-center gap-3 px-6 py-12 text-center", className)}
    >
      {icon && (
        <div className="flex size-10 items-center justify-center rounded-lg border border-line text-ink-3 [&_svg]:size-5">
          {icon}
        </div>
      )}
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-base font-semibold">{title}</p>
        {description && <p className="text-md text-ink-3">{description}</p>}
      </div>
      {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
