import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/cn";

/**
 * Outlined by default. The design allows one filled button per screen, for the
 * action the screen exists for, so `primary` is something you opt into rather
 * than the thing you get by not thinking about it.
 *
 * Heights come from `h-control`: 38px (32px for `sm`) on desktop, 44px on
 * phones, per the touch rule in app/globals.css.
 */
export const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border font-medium whitespace-nowrap transition-[background-color,opacity] select-none",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    "[&_svg]:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        outline: "border-line-strong bg-transparent text-ink hover:bg-hover",
        /** The one primary action on the screen. */
        primary: "border-primary bg-primary text-on-primary hover:opacity-90",
        ghost: "border-transparent bg-transparent text-ink hover:bg-hover",
        /** The confirm button of a "Delete …?" dialog, and nowhere else. */
        danger: "border-danger bg-danger text-surface hover:opacity-90",
        link: "border-transparent text-accent underline-offset-4 hover:underline",
      },
      size: {
        md: "h-control px-3.5 text-md",
        sm: "h-control-sm px-2.5 text-sm",
        icon: "size-control",
        "icon-sm": "size-control-sm",
      },
    },
    compoundVariants: [
      // A link reads as text: no box, whatever the size.
      { variant: "link", size: ["md", "sm"], class: "h-auto px-0" },
    ],
    defaultVariants: {
      variant: "outline",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  /** Render the child element (a `<Link>`, say) with the button's styles. */
  asChild?: boolean;
  /** Shows a spinner and disables the button until the work finishes. */
  loading?: boolean;
}

/**
 * Icon-only buttons (`size="icon"`) have no text, so they need an
 * `aria-label`, or a screen reader announces just "button".
 */
export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  type,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      // Not "submit": a button inside a form only submits it when it says so.
      type={asChild ? undefined : (type ?? "button")}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {/* Slot needs exactly one child, so asChild gets no spinner. */}
      {loading && !asChild ? (
        <>
          <LoaderCircle className="animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}
