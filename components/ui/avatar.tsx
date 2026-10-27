"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Avatar as AvatarPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";
import { getInitials } from "@/lib/utils";

const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong font-semibold text-ink-2 select-none",
  {
    variants: {
      size: {
        sm: "size-6 text-[0.625rem]",
        md: "size-8 text-2xs",
        lg: "size-10 text-xs",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

interface AvatarProps extends VariantProps<typeof avatarVariants> {
  name: string;
  src?: string;
  className?: string;
}

/**
 * A photo, or outlined initials until there is one (or if it fails to load).
 *
 * Hidden from assistive tech: an avatar nearly always sits beside the person's
 * name, and announcing both reads the name twice. Where one stands alone, put
 * the name in a tooltip or sr-only text next to it.
 */
export function Avatar({ name, src, size, className }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      aria-hidden="true"
      className={cn(avatarVariants({ size }), className)}
    >
      {src && <AvatarPrimitive.Image src={src} alt="" className="size-full object-cover" />}
      <AvatarPrimitive.Fallback delayMs={src ? 400 : undefined}>
        {getInitials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
