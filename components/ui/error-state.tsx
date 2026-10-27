"use client";

import { RotateCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface ErrorStateProps {
  title?: React.ReactNode;
  /** What happened, in words the reader can act on. */
  description?: React.ReactNode;
  /** Shows a "Try again" button. */
  onRetry?: () => void;
  className?: string;
}

/**
 * Something failed to load. EmptyState's sibling: same shape, a danger icon,
 * and a way to try again. Announced to screen readers as it appears.
 */
export function ErrorState({
  title = "Couldn't load this",
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      data-slot="error-state"
      role="alert"
      className={cn("flex flex-col items-center gap-3 px-6 py-10 text-center", className)}
    >
      <div className="flex size-10 items-center justify-center rounded-lg border border-danger/40 text-danger [&_svg]:size-5">
        <TriangleAlert />
      </div>
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-base font-semibold">{title}</p>
        {description && <p className="text-md text-ink-3">{description}</p>}
      </div>
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          <RotateCw />
          Try again
        </Button>
      )}
    </div>
  );
}
