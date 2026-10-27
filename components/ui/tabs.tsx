"use client";

import Link from "next/link";
import { Tabs as TabsPrimitive } from "radix-ui";
import { useEffect, useRef } from "react";
import { Count } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

/**
 * The baseline is an inset shadow rather than a border the tabs overlap with
 * a negative margin (the design's way): the list scrolls sideways on a phone,
 * and a scroll container clips anything that pokes outside it.
 */
const listClasses =
  "scrollbar-none flex gap-1 overflow-x-auto shadow-[inset_0_-1px_0_var(--color-line)]";

const tabClasses = cn(
  "inline-flex h-11 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 text-md font-medium whitespace-nowrap text-ink-3 transition-colors md:h-10.5",
  "hover:text-ink disabled:pointer-events-none disabled:opacity-50",
  "data-[state=active]:border-accent data-[state=active]:text-ink",
  // Inside the scroll container, so the focus outline is drawn inwards.
  "focus-visible:-outline-offset-2",
);

/**
 * Underlined tabs for switching between panels within one page. For
 * switching how one thing is shown, use Segmented. When each tab is a page
 * of its own (its own URL), use TabNav.
 */
export function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-5", className)}
      {...props}
    />
  );
}

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List data-slot="tabs-list" className={cn(listClasses, className)} {...props} />
  );
}

interface TabsTriggerProps extends React.ComponentProps<typeof TabsPrimitive.Trigger> {
  /** Row count shown beside the label. */
  count?: number;
}

export function TabsTrigger({ className, count, children, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(tabClasses, className)}
      {...props}
    >
      {children}
      {count !== undefined && <Count value={count} showZero />}
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("min-w-0 outline-hidden", className)}
      {...props}
    />
  );
}

/**
 * Tabs that are links: each tab is a page with its own URL, so it can be
 * bookmarked, shared and reached with the back button. A site's Overview,
 * Schedule and Budget work this way.
 *
 *   <TabNav aria-label="Project sections">
 *     <TabNavLink href="/projects/prj_lekki" active>Overview</TabNavLink>
 *     <TabNavLink href="/projects/prj_lekki/budget">Budget</TabNavLink>
 *   </TabNav>
 *
 * It's navigation, not a tablist, so it's a <nav> of links with
 * `aria-current="page"` on the active one; arrow keys don't move between them.
 *
 * On a phone the row scrolls sideways, and it scrolls itself to keep the
 * current tab in view, so landing on "Team" doesn't leave it off-screen.
 */
export function TabNav({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"nav">, "ref">) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = ref.current;
    const current = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !current) return;
    const box = nav.getBoundingClientRect();
    const tab = current.getBoundingClientRect();
    if (tab.left >= box.left && tab.right <= box.right) return;
    nav.scrollLeft += tab.left - box.left - (box.width - tab.width) / 2;
  });

  return (
    <nav ref={ref} data-slot="tab-nav" className={cn(listClasses, className)} {...props}>
      {children}
    </nav>
  );
}

interface TabNavLinkProps extends Omit<React.ComponentProps<typeof Link>, "href"> {
  /** Leave out for a placeholder tab, drawn the same but not a link (a loading state). */
  href?: string;
  active?: boolean;
  /** Row count shown beside the label. */
  count?: number;
}

export function TabNavLink({
  href,
  active = false,
  count,
  className,
  children,
  ...props
}: TabNavLinkProps) {
  const content = (
    <>
      {children}
      {count !== undefined && <Count value={count} showZero />}
    </>
  );
  const state = active ? "active" : "inactive";

  if (href === undefined) {
    return (
      <span data-slot="tab-nav-link" data-state={state} className={cn(tabClasses, className)}>
        {content}
      </span>
    );
  }
  return (
    <Link
      data-slot="tab-nav-link"
      data-state={state}
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(tabClasses, className)}
      {...props}
    >
      {content}
    </Link>
  );
}
