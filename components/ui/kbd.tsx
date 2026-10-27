import { cn } from "@/lib/cn";

/** A key, as in a shortcut hint: ⌘K. */
export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-line-strong px-1.5 font-mono text-2xs text-ink-3",
        className,
      )}
      {...props}
    />
  );
}
