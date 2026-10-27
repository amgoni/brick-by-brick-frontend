"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useIsMac } from "@/hooks/use-is-mac";
import { useUiStore } from "@/store/ui.store";

/**
 * Search on the left, then theme, notifications and account. On a phone the
 * search box shrinks to an icon, the theme switch moves into the account
 * menu, and the menu button and logo take the left.
 */
export function TopBar() {
  const openCommand = useUiStore((state) => state.openCommand);
  const isMac = useIsMac();

  return (
    <header className="sticky top-0 z-30 flex h-15 shrink-0 items-center gap-1 border-b border-line bg-surface px-2 md:h-16 md:gap-3 md:px-8">
      <MobileNav />
      <Link
        href="/"
        aria-label="Brick By Brick, go to the dashboard"
        className="flex size-11 items-center justify-center rounded-lg md:hidden"
      >
        <LogoMark />
      </Link>

      <button
        type="button"
        onClick={() => openCommand()}
        className="hidden h-control max-w-110 flex-[1_1_15rem] items-center gap-2.5 rounded-lg border border-line px-3 text-left text-md text-ink-3 transition-colors hover:border-line-strong md:flex"
      >
        <Search />
        <span className="flex-1 truncate">Search or jump to…</span>
        {isMac !== null && <Kbd>{isMac ? "⌘K" : "Ctrl K"}</Kbd>}
      </button>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Search"
          onClick={() => openCommand()}
          className="md:hidden"
        >
          <Search />
        </Button>
        <ThemeToggle className="hidden md:inline-flex" />
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  );
}
