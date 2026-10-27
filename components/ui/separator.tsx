import { cn } from "@/lib/cn";

interface SeparatorProps extends React.ComponentProps<"div"> {
  orientation?: "horizontal" | "vertical";
  /**
   * Purely visual (the default), so assistive tech skips it. Set false when
   * the line genuinely separates two groups of content.
   */
  decorative?: boolean;
}

export function Separator({
  orientation = "horizontal",
  decorative = true,
  className,
  ...props
}: SeparatorProps) {
  return (
    <div
      data-slot="separator"
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        "shrink-0 bg-line",
        orientation === "horizontal" ? "h-px w-full" : "w-px self-stretch",
        className,
      )}
      {...props}
    />
  );
}
