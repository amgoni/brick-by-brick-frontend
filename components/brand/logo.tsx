import { cn } from "@/lib/cn";

/**
 * Two courses of bricks, one of them laid. Outlined in the accent like the
 * rest of the interface, with a single solid brick, the way the design keeps
 * fill for the one thing that matters.
 */
export function LogoMark({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 26 26"
      aria-hidden="true"
      className={cn("size-6.5 shrink-0 fill-none stroke-accent stroke-[1.6]", className)}
      {...props}
    >
      <rect x="2" y="4" width="10" height="7" rx="1.5" />
      <rect x="14" y="4" width="10" height="7" rx="1.5" />
      <rect x="2" y="15" width="4" height="7" rx="1.5" />
      <rect x="8" y="15" width="10" height="7" rx="1.5" className="fill-accent" />
      <rect x="20" y="15" width="4" height="7" rx="1.5" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink",
        className,
      )}
    >
      <LogoMark />
      Brick By Brick
    </span>
  );
}
