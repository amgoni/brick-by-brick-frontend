import { cn } from "@/lib/cn";

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("text-md font-medium text-ink select-none", className)}
      {...props}
    />
  );
}
