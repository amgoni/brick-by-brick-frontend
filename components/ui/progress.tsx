import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/format";

interface ProgressProps extends Omit<React.ComponentProps<"div">, "children"> {
  value: number;
  max?: number;
  /** Print the percentage beside the bar. */
  showValue?: boolean;
}

/**
 * An outlined track with a data-coloured fill. `className` goes on the
 * wrapper (for width); other props, including `aria-label`, go on the bar.
 * Give it an `aria-label` unless a visible label already says what it measures.
 */
export function Progress({
  value,
  max = 100,
  showValue = false,
  className,
  ...props
}: ProgressProps) {
  const ratio = Math.min(1, Math.max(0, value / max));
  return (
    <div data-slot="progress" className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className="h-1.5 flex-1 overflow-hidden rounded-full border border-line-strong"
        {...props}
      >
        <div className="h-full rounded-full bg-data" style={{ width: `${ratio * 100}%` }} />
      </div>
      {showValue && (
        <span className="w-9 shrink-0 text-right text-sm tabular-nums">{formatPercent(ratio)}</span>
      )}
    </div>
  );
}
