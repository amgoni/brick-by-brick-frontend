"use client";

import { CircleUser, LogOut, Monitor, Moon, Settings, Sun } from "lucide-react";
import Link from "next/link";
import { QueryBoundary } from "@/components/data/query-boundary";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { useTheme } from "@/hooks/use-theme";
import { useCurrentUser } from "@/lib/queries/me";
import { THEME_PREFERENCES, type ThemePreference } from "@/lib/theme";

/** The account button at the end of the top bar, and its menu. */
export function UserMenu() {
  return (
    <QueryBoundary
      fallback={
        <span className="flex h-11 items-center gap-2.5 pr-2 pl-1" aria-hidden="true">
          <Skeleton className="size-8 rounded-full" />
          <span className="hidden flex-col gap-1.5 md:flex">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2.5 w-20" />
          </span>
        </span>
      }
      errorFallback={() => (
        <Button variant="ghost" size="icon" aria-label="Account unavailable" disabled>
          <CircleUser />
        </Button>
      )}
    >
      <AccountMenu />
    </QueryBoundary>
  );
}

const THEME_OPTIONS: Record<ThemePreference, { label: string; icon: typeof Sun }> = {
  light: { label: "Light", icon: Sun },
  dark: { label: "Dark", icon: Moon },
  system: { label: "Match system", icon: Monitor },
};

function AccountMenu() {
  const { data: user } = useCurrentUser();
  const { preference, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Account: ${user.name}, ${user.role}`}
          className="flex h-11 items-center gap-2.5 rounded-[10px] border border-transparent pr-1 pl-1 text-left transition-colors hover:border-line data-[state=open]:border-line md:pr-2"
        >
          <Avatar name={user.name} />
          <span className="hidden flex-col leading-tight md:flex">
            <span className="text-md font-medium">{user.name}</span>
            <span className="text-xs text-ink-3">{user.role}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2.5 py-2">
          <p className="truncate text-md font-medium">{user.name}</p>
          <p className="truncate text-sm text-ink-3">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Here as well as in the top bar, where the toggle is hidden on phones. */}
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={preference}
          onValueChange={(value) => setTheme(value as ThemePreference)}
        >
          {THEME_PREFERENCES.map((option) => {
            const { label, icon: Icon } = THEME_OPTIONS[option];
            return (
              <DropdownMenuRadioItem key={option} value={option}>
                <Icon />
                {label}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => toast("Signing in and out arrives with the backend.")}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
