import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { PurchaseOrderSheet } from "@/components/inventory/purchase-order-sheet";
import { CommandPalette } from "@/components/layout/command-palette";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TopBar } from "@/components/layout/top-bar";

/**
 * The frame around every signed-in page: the sidebar from the breakpoint up
 * (a drawer below it), the top bar, the command palette, and the drawers
 * that can be opened from anywhere (a new purchase order).
 *
 * It lives in a layout, so it isn't re-rendered or remounted on navigation;
 * only the page inside <main> changes.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-surface px-3 py-2 text-md font-medium shadow-pop focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh w-62 shrink-0 flex-col gap-3.5 overflow-y-auto border-r border-line px-3 pt-4 pb-6 md:flex">
        <Link href="/" className="rounded-lg px-2 py-1">
          <Logo />
        </Link>
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main
          id="main"
          tabIndex={-1}
          className="flex w-full max-w-content flex-col gap-5 px-4 pt-5 pb-12 outline-hidden md:px-8 md:pt-7 md:pb-14"
        >
          {children}
        </main>
      </div>

      <CommandPalette />
      <PurchaseOrderSheet />
    </div>
  );
}
