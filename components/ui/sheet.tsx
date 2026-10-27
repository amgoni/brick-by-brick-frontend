"use client";

import { X } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * A panel that slides in from an edge: the design's drawer (a new purchase
 * order, a record's details) on the right at 460px, full width on a phone.
 * Same parts as Dialog, plus SheetBody, which scrolls while the header and
 * footer stay put.
 */
export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;

const sides = {
  right:
    "inset-y-0 right-0 h-full w-full max-w-115 border-l shadow-drawer data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
  left: "inset-y-0 left-0 h-full w-full max-w-115 border-r shadow-modal data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
  bottom:
    "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-2xl border-t shadow-modal data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
} as const;

interface SheetContentProps extends React.ComponentProps<typeof SheetPrimitive.Content> {
  side?: keyof typeof sides;
  showClose?: boolean;
}

export function SheetContent({
  side = "right",
  showClose = true,
  className,
  children,
  ...props
}: SheetContentProps) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay
        data-slot="sheet-overlay"
        className="fixed inset-0 z-50 bg-scrim data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
      />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col border-line-strong bg-surface text-ink outline-hidden",
          "data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:animate-in data-[state=open]:duration-300",
          sides[side],
          className,
        )}
        {...props}
      >
        {children}
        {showClose && (
          <SheetPrimitive.Close asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close"
              className="absolute top-3.5 right-3.5"
            >
              <X />
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1 border-b border-line px-5 py-4 pr-14", className)}
      {...props}
    />
  );
}

export function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-md text-ink-3", className)}
      {...props}
    />
  );
}

export function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("flex flex-1 flex-col gap-4 overflow-y-auto p-5", className)}
      {...props}
    />
  );
}

export function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3.5", className)}
      {...props}
    />
  );
}
