"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, Suspense } from "react";
import { QueryBoundary } from "@/components/data/query-boundary";
import { Count } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { isActivePath, NAV, type NavItem } from "@/lib/nav";
import { useWorkspaceCounts } from "@/lib/queries/me";

interface SidebarNavProps {
  onNavigate?: () => void;
}

/**
 * The main navigation: the desktop sidebar and the phone's drawer both render
 * this. `onNavigate` lets the drawer close itself when a link is followed.
 *
 * Highlighting the current section means reading the URL, and on a page with
 * a dynamic segment (/projects/[id]) the URL isn't known while the page is
 * prerendered: usePathname suspends there, and without a Suspense boundary
 * the build fails. So the links render twice over: without a highlight as the
 * fallback, which is what that page's prerendered HTML gets, and with one as
 * soon as the path is known. On every other page the path is known at build
 * time and the highlight is in the HTML from the start.
 */
export function SidebarNav({ onNavigate }: SidebarNavProps) {
  return (
    <Suspense fallback={<NavLinks pathname={null} onNavigate={onNavigate} />}>
      <CurrentNavLinks onNavigate={onNavigate} />
    </Suspense>
  );
}

function CurrentNavLinks({ onNavigate }: SidebarNavProps) {
  return <NavLinks pathname={usePathname()} onNavigate={onNavigate} />;
}

function NavLinks({ pathname, onNavigate }: SidebarNavProps & { pathname: string | null }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {NAV.map((section, index) => (
        <Fragment key={section.label ?? index}>
          {section.label && <p className="px-2.5 pt-4 pb-1.5 caps text-ink-3">{section.label}</p>}
          {section.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname !== null && isActivePath(pathname, item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </Fragment>
      ))}
    </nav>
  );
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "flex h-11 items-center gap-2.5 rounded-lg border border-transparent px-2.5 text-md font-medium text-ink-2 transition-colors md:h-9",
        "hover:bg-hover hover:text-ink",
        active && "border-line-strong text-ink",
      )}
    >
      <Icon className={cn(active && "text-accent")} />
      {item.label}
      {item.badge && (
        // Each badge is its own small data region; they share one cached request.
        <QueryBoundary fallback={null} errorFallback={() => null}>
          <NavCount badge={item.badge} />
        </QueryBoundary>
      )}
    </Link>
  );
}

function NavCount({ badge }: { badge: NonNullable<NavItem["badge"]> }) {
  const { data } = useWorkspaceCounts();
  const count = data[badge];
  if (count === 0) return null;
  return (
    <span className="ml-auto">
      <Count value={count} />
      <span className="sr-only"> waiting for you</span>
    </span>
  );
}
