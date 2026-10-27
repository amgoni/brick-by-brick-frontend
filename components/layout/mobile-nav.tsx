"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetBody, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/**
 * Below the breakpoint the sidebar becomes a drawer from the left. (The design
 * folds it into a second bar above the content instead; a drawer keeps the
 * whole screen for the page and is where people look for a menu on a phone.)
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open navigation" className="md:hidden">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="max-w-72" aria-describedby={undefined}>
        <div className="flex h-15 shrink-0 items-center border-b border-line px-5">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Logo />
        </div>
        <SheetBody className="gap-0 p-3">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
