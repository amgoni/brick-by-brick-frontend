import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

const TONES: Record<string, { icon: LucideIcon; classes: string }> = {
  info: { icon: Info, classes: "border-accent/40 [&>svg]:text-accent" },
  success: { icon: CircleCheck, classes: "border-success/40 [&>svg]:text-success" },
  warning: { icon: TriangleAlert, classes: "border-warning/40 [&>svg]:text-warning" },
  danger: { icon: CircleAlert, classes: "border-danger/40 [&>svg]:text-danger" },
};

interface AlertProps extends Omit<React.ComponentProps<"div">, "title"> {
  tone?: "info" | "success" | "warning" | "danger";
  title?: React.ReactNode;
}

/**
 * A boxed message inside a page or a form: a rule worth knowing before you
 * submit ("Orders over ₦5,000,000 need approval"), or why the server refused.
 * Outlined in the tone's colour, with its icon, like a badge at full width.
 *
 * Give it `role="alert"` when it appears in response to something the user
 * did (a failed submit), so a screen reader announces it.
 */
export function Alert({ tone = "info", title, className, children, ...props }: AlertProps) {
  const { icon: Icon, classes } = TONES[tone]!;
  return (
    <div
      data-slot="alert"
      className={cn(
        "flex gap-2.5 rounded-lg border bg-surface px-3.5 py-3 text-md text-ink-2",
        "[&>svg]:mt-0.5 [&>svg]:shrink-0",
        classes,
        className,
      )}
      {...props}
    >
      <Icon aria-hidden="true" />
      <div className="flex min-w-0 flex-col gap-0.5">
        {title && <p className="font-medium text-ink">{title}</p>}
        {children}
      </div>
    </div>
  );
}
