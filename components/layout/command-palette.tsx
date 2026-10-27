"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ClipboardPen,
  Forklift,
  HardHat,
  LoaderCircle,
  Package,
  Plus,
  Receipt,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { projectHref } from "@/components/projects/project-link";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandMeta,
} from "@/components/ui/command";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useHotkey } from "@/hooks/use-hotkey";
import type { SearchResultKind } from "@/lib/api/types";
import { NAV_ITEMS } from "@/lib/nav";
import { MIN_SEARCH_LENGTH, searchQueries } from "@/lib/queries/search";
import { useUiStore } from "@/store/ui.store";

const CREATE_ACTIONS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "New invoice", href: "/invoices", icon: Receipt },
  { label: "New project", href: "/projects", icon: HardHat },
  { label: "New purchase order", href: "/inventory", icon: Package },
  { label: "New daily site report", href: "/projects", icon: ClipboardPen },
];

// A result opens its own page where there is one, and its section until then.
const RECORDS: Record<
  SearchResultKind,
  { label: string; href: (id: string) => string; icon: LucideIcon }
> = {
  project: { label: "Project", href: (id) => projectHref(id), icon: HardHat },
  invoice: { label: "Invoice", href: () => "/invoices", icon: Receipt },
  equipment: { label: "Equipment", href: () => "/equipment", icon: Forklift },
  stock_item: { label: "Stock item", href: () => "/inventory", icon: Package },
  person: { label: "Person", href: () => "/staff", icon: User },
};

/**
 * ⌘K / Ctrl K from anywhere, the top bar's search box, or a New button.
 * Pages and actions are matched here; records are searched on the server.
 */
export function CommandPalette() {
  const open = useUiStore((state) => state.commandOpen);
  const setOpen = useUiStore((state) => state.setCommandOpen);

  useHotkey("mod+k", () => setOpen(!useUiStore.getState().commandOpen), { allowInInputs: true });

  return (
    <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
      {/* Mounted only while open, so every opening starts from a clean slate. */}
      <PaletteContent onClose={() => setOpen(false)} />
    </CommandDialog>
  );
}

function PaletteContent({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState(() => useUiStore.getState().commandQuery);
  const typed = query.trim().toLowerCase();
  // Wait for a pause in typing before asking the server.
  const debounced = useDebouncedValue(typed, 200);
  const searching = debounced.length >= MIN_SEARCH_LENGTH;
  const { data: results = [], isFetching } = useQuery(searchQueries.results(debounced));

  const pages = NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(typed));
  const actions = CREATE_ACTIONS.filter((action) => action.label.toLowerCase().includes(typed));
  const records = searching ? results : [];

  function go(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search projects, invoices, stock, people…"
        trailing={
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X />
            Close
          </Button>
        }
      />
      <CommandList>
        {!isFetching && (
          <CommandEmpty>No matches. Try a project, invoice number or stock item.</CommandEmpty>
        )}

        {pages.length > 0 && (
          <CommandGroup heading={typed ? "Pages" : "Jump to"}>
            {pages.map((item) => (
              <CommandItem
                key={item.href}
                value={`page ${item.href}`}
                onSelect={() => go(item.href)}
              >
                <item.icon />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {actions.length > 0 && (
          <CommandGroup heading="Create">
            {actions.map((action) => (
              <CommandItem
                key={action.label}
                value={`create ${action.label}`}
                onSelect={() => go(action.href)}
              >
                <Plus />
                {action.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {searching && (records.length > 0 || isFetching) && (
          <CommandGroup heading="Records">
            {records.map((result) => {
              const record = RECORDS[result.kind];
              return (
                <CommandItem
                  key={`${result.kind}:${result.id}`}
                  value={`record ${result.kind} ${result.id}`}
                  onSelect={() => go(record.href(result.id))}
                >
                  <record.icon />
                  <span className="flex min-w-0 flex-col py-1.5">
                    <span className="truncate">{result.title}</span>
                    <span className="truncate text-sm text-ink-3">{result.subtitle}</span>
                  </span>
                  <CommandMeta>{record.label}</CommandMeta>
                </CommandItem>
              );
            })}
            {isFetching && records.length === 0 && (
              <div className="flex items-center gap-3 px-4 py-3 text-md text-ink-3">
                <LoaderCircle className="animate-spin" />
                Searching…
              </div>
            )}
          </CommandGroup>
        )}
      </CommandList>
    </>
  );
}
