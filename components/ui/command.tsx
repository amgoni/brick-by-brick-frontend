"use client";

import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";

/**
 * A searchable list of commands (cmdk). On its own it's an inline picker;
 * inside CommandDialog it's the ⌘K palette: "Search or jump to…".
 */
export function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn("flex size-full flex-col overflow-hidden bg-surface text-ink", className)}
      {...props}
    />
  );
}

interface CommandInputProps extends React.ComponentProps<typeof CommandPrimitive.Input> {
  /** Right of the input: a Close button in the palette. */
  trailing?: React.ReactNode;
}

export function CommandInput({ className, trailing, ...props }: CommandInputProps) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex items-center gap-2.5 border-b border-line pr-3 pl-4 text-ink-3"
    >
      <Search />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "h-13 min-w-0 flex-1 bg-transparent text-lg text-ink outline-hidden placeholder:text-ink-3 md:text-[0.9375rem]",
          className,
        )}
        {...props}
      />
      {trailing}
    </div>
  );
}

export function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "max-h-[min(22.5rem,60dvh)] overflow-y-auto overscroll-contain pb-2",
        className,
      )}
      {...props}
    />
  );
}

export function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("px-4 py-3 text-md text-ink-3", className)}
      {...props}
    />
  );
}

export function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:caps [&_[cmdk-group-heading]]:text-ink-3",
        className,
      )}
      {...props}
    />
  );
}

export function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "flex min-h-11 cursor-default items-center gap-3 px-4 text-md text-ink outline-hidden select-none md:min-h-10.5",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-hover",
        "[&_svg]:text-ink-3",
        className,
      )}
      {...props}
    />
  );
}

/** Right-aligned, quiet: what kind of thing a result is ("Invoice"), or a shortcut. */
export function CommandMeta({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-meta"
      className={cn("ml-auto text-xs text-ink-3", className)}
      {...props}
    />
  );
}

export function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("my-1 h-px bg-line", className)}
      {...props}
    />
  );
}

interface CommandDialogProps extends React.ComponentProps<typeof DialogPrimitive.Root> {
  /** For screen readers; the palette has no visible title. */
  title?: string;
  className?: string;
  /** Passed to cmdk; set false when results are filtered server-side. */
  shouldFilter?: boolean;
}

/**
 * The palette: pinned 96px from the top rather than centred, so it doesn't
 * jump about as the result list grows and shrinks.
 */
export function CommandDialog({
  title = "Search and jump",
  className,
  shouldFilter,
  children,
  ...props
}: CommandDialogProps) {
  return (
    <DialogPrimitive.Root {...props}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          data-slot="command-dialog"
          aria-describedby={undefined}
          className={cn(
            "fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-140 -translate-x-1/2 overflow-hidden rounded-xl border border-line-strong bg-surface shadow-modal outline-hidden md:top-24",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            className,
          )}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <Command shouldFilter={shouldFilter}>{children}</Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
