"use client";

import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from "lucide-react";
import { Toaster as Sonner, toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * `toast("Purchase order sent")`, `toast.success(…)`, `toast.error(…)`.
 * Sonner does the queueing, stacking, swipe-to-dismiss and the live region
 * that announces each toast; this file only makes it look like the design.
 */
export { toast };

/**
 * Mounted once, in the root layout. An outlined card bottom-right, full width
 * on a phone, with the tone carried by the icon (and the words) rather than a
 * coloured background.
 */
export function Toaster(props: React.ComponentProps<typeof Sonner>) {
  return (
    <Sonner
      position="bottom-right"
      offset={24}
      mobileOffset={16}
      gap={8}
      icons={{
        success: <CircleCheck className="text-success" />,
        error: <CircleAlert className="text-danger" />,
        warning: <TriangleAlert className="text-warning" />,
        info: <Info className="text-accent" />,
        loading: <LoaderCircle className="animate-spin text-ink-3" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-2.5 rounded-[10px] border border-line-strong bg-surface px-3.5 py-3 text-md text-ink shadow-pop",
          content: "flex min-w-0 flex-1 flex-col gap-0.5",
          title: "font-medium",
          description: "text-sm text-ink-3",
          icon: "flex shrink-0 items-center",
          actionButton: cn(buttonVariants({ size: "sm" }), "shrink-0"),
          cancelButton: cn(buttonVariants({ size: "sm", variant: "ghost" }), "shrink-0"),
        },
      }}
      {...props}
    />
  );
}
