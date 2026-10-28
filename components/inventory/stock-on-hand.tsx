"use client";

import { useSuspenseQueries } from "@tanstack/react-query";
import { Download, Package, PackageSearch, Search, TriangleAlert, X } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { QueryBoundary } from "@/components/data/query-boundary";
import {
  formatQuantity,
  isBelowReorder,
  STOCK_STATE,
  stockState,
  StockStateBadge,
  suggestedOrder,
} from "@/components/inventory/inventory-status";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { Toggle } from "@/components/ui/toggle";
import type { StockLevel, StockLocation } from "@/lib/api/types";
import { downloadCsv, type CsvColumn } from "@/lib/csv";
import { formatCount, formatMoney, toISODate } from "@/lib/format";
import { inventoryQueries, useStockLevels } from "@/lib/queries/inventory";
import { useUiStore } from "@/store/ui.store";

const ALL = "all";

interface StockFilters {
  query: string;
  locationId: string;
  belowOnly: boolean;
}

/*
 * Stock is filtered in the browser, like projects: a few hundred lines at
 * most for now. When a company's stock outgrows that, the filters become
 * query parameters and the list pages on the server (see the pagination
 * question in notes/).
 */

const inLocation = (level: StockLevel, locationId: string) =>
  locationId === ALL || level.location.id === locationId;

function filterStock(levels: StockLevel[], { query, locationId, belowOnly }: StockFilters) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return levels
    .filter((level) => {
      if (!inLocation(level, locationId) || (belowOnly && !isBelowReorder(level))) return false;
      const text = `${level.item.name} ${level.item.sku} ${level.item.category}`.toLowerCase();
      return words.every((word) => text.includes(word));
    })
    .sort(
      (a, b) =>
        a.item.name.localeCompare(b.item.name) || a.location.name.localeCompare(b.location.name),
    );
}

const valueOf = (level: StockLevel) => level.quantity * level.item.unitCost;

/** The Stock on hand tab: every item at every store, what it's worth, and what's running low. */
export function StockOnHand() {
  const [query, setQuery] = useState("");
  const [locationId, setLocationId] = useState(ALL);
  const [belowOnly, setBelowOnly] = useState(false);
  const filters: StockFilters = { query: useDeferredValue(query), locationId, belowOnly };

  const clearFilters = () => {
    setQuery("");
    setLocationId(ALL);
    setBelowOnly(false);
  };
  const controls = {
    filters,
    onLocationChange: setLocationId,
    onBelowOnlyChange: setBelowOnly,
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <InputGroup className="w-full md:max-w-90 md:flex-[1_1_16rem]">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search item or SKU"
            aria-label="Search stock"
            className="[&::-webkit-search-cancel-button]:appearance-none"
          />
          {query && (
            <InputGroupAddon>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Clear search"
                onClick={() => setQuery("")}
              >
                <X />
              </Button>
            </InputGroupAddon>
          )}
        </InputGroup>
        {/* The controls work before the stores and counts arrive, and without them if they fail. */}
        <QueryBoundary
          fallback={<StockControls {...controls} />}
          errorFallback={() => <StockControls {...controls} />}
        >
          <LoadedStockControls {...controls} />
        </QueryBoundary>
      </div>

      <QueryBoundary
        fallback={
          <Card>
            <TableSkeleton rows={8} columns={7} />
          </Card>
        }
      >
        <StockTable filters={filters} onClearFilters={clearFilters} />
      </QueryBoundary>
    </div>
  );
}

interface StockControlsProps {
  filters: StockFilters;
  onLocationChange: (locationId: string) => void;
  onBelowOnlyChange: (belowOnly: boolean) => void;
  /** Absent while loading: the controls show, disabled and without counts. */
  data?: { locations: StockLocation[]; levels: StockLevel[] };
}

function StockControls({ filters, onLocationChange, onBelowOnlyChange, data }: StockControlsProps) {
  const here = data?.levels.filter((level) => inLocation(level, filters.locationId)) ?? [];
  const shown = data ? filterStock(data.levels, filters) : [];
  return (
    <>
      <Select
        aria-label="Location"
        value={filters.locationId}
        onChange={(event) => onLocationChange(event.target.value)}
        disabled={!data}
        className="w-full sm:w-60"
      >
        <option value={ALL}>All locations</option>
        {data?.locations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name}
          </option>
        ))}
      </Select>
      <Toggle
        pressed={filters.belowOnly}
        onPressedChange={onBelowOnlyChange}
        count={data ? here.filter(isBelowReorder).length : undefined}
        disabled={!data}
      >
        <TriangleAlert />
        Below reorder level
      </Toggle>
      <div className="flex items-center gap-3 md:ml-auto">
        {data && (
          <span aria-live="polite" className="text-md text-ink-3 tabular-nums">
            {shown.length} of {formatCount(data.levels.length, "line")}
          </span>
        )}
        <Button disabled={shown.length === 0} onClick={() => exportStock(shown)}>
          <Download />
          Export
        </Button>
      </div>
    </>
  );
}

function LoadedStockControls(props: Omit<StockControlsProps, "data">) {
  const [{ data: locations }, { data: levels }] = useSuspenseQueries({
    queries: [inventoryQueries.locations(), inventoryQueries.stock()],
  });
  return <StockControls {...props} data={{ locations, levels }} />;
}

function StockTable({
  filters,
  onClearFilters,
}: {
  filters: StockFilters;
  onClearFilters: () => void;
}) {
  const { data: levels } = useStockLevels();
  const openPurchaseOrder = useUiStore((state) => state.openPurchaseOrder);
  const shown = filterStock(levels, filters);

  if (levels.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Package />}
          title="No stock recorded yet"
          description="Stock shows here once deliveries are received into a store."
        />
      </Card>
    );
  }
  if (shown.length === 0) {
    return (
      <Card className="border-dashed">
        <EmptyState
          icon={<PackageSearch />}
          title="No stock matches"
          description="Try another location, or clear the search."
          action={
            <Button size="sm" onClick={onClearFilters}>
              Clear filters
            </Button>
          }
        />
      </Card>
    );
  }

  const total = shown.reduce((sum, level) => sum + valueOf(level), 0);
  const orderButton = (level: StockLevel) => (
    <Button
      size="sm"
      aria-label={`Order ${level.item.name} for ${level.location.name}`}
      onClick={() =>
        openPurchaseOrder({
          itemId: level.item.id,
          deliverToId: level.location.id,
          quantity: suggestedOrder(level),
        })
      }
    >
      Order
    </Button>
  );

  // Eight columns: a table from the breakpoint up, a list on phones.
  return (
    <Card>
      <ul className="md:hidden">
        {shown.map((level) => (
          <li
            key={level.id}
            className="flex flex-col gap-1 border-b border-line px-4.5 py-3.5 last:border-b-0"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-medium">{level.item.name}</span>
              <StockStateBadge level={level} />
            </div>
            <div className="text-sm text-ink-3">
              <span className="font-mono text-xs">{level.item.sku}</span> · {level.location.name}
            </div>
            <div className="mt-1 flex items-center justify-between gap-3 text-md tabular-nums">
              <span>
                <span className="font-medium">
                  {formatQuantity(level.quantity, level.item.unit)}
                </span>
                <span className="text-ink-3">
                  {" "}
                  · reorder at {formatQuantity(level.reorderLevel, level.item.unit)}
                </span>
              </span>
              {orderButton(level)}
            </div>
          </li>
        ))}
        <li className="flex justify-between gap-3 border-t border-line-strong px-4.5 py-3.5 font-semibold tabular-nums">
          <span>Total stock value</span>
          <span>{formatMoney(total)}</span>
        </li>
      </ul>

      <Table className="min-w-260 max-md:hidden">
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Location</TableHead>
            <TableHead numeric>On hand</TableHead>
            <TableHead numeric>Reorder at</TableHead>
            <TableHead>Status</TableHead>
            <TableHead numeric>Unit cost</TableHead>
            <TableHead numeric>Value</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map((level) => (
            <TableRow key={level.id}>
              <TableCell>
                <div className="font-medium">{level.item.name}</div>
                <div className="text-sm text-ink-3">
                  <span className="font-mono text-xs">{level.item.sku}</span> ·{" "}
                  {level.item.category}
                </div>
              </TableCell>
              <TableCell className="text-ink-2">{level.location.name}</TableCell>
              <TableCell numeric className="font-medium">
                {formatQuantity(level.quantity, level.item.unit)}
              </TableCell>
              <TableCell numeric className="text-ink-3">
                {formatQuantity(level.reorderLevel, level.item.unit)}
              </TableCell>
              <TableCell>
                <StockStateBadge level={level} />
              </TableCell>
              <TableCell numeric className="text-ink-2">
                {formatMoney(level.item.unitCost)}
              </TableCell>
              <TableCell numeric>{formatMoney(valueOf(level))}</TableCell>
              <TableCell className="text-right">{orderButton(level)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={6}>Total stock value</TableCell>
            <TableCell numeric>{formatMoney(total)}</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </Card>
  );
}

const EXPORT_COLUMNS: CsvColumn<StockLevel>[] = [
  { header: "SKU", value: (level) => level.item.sku },
  { header: "Item", value: (level) => level.item.name },
  { header: "Category", value: (level) => level.item.category },
  { header: "Location", value: (level) => level.location.name },
  { header: "On hand", value: (level) => level.quantity },
  { header: "Unit", value: (level) => level.item.unit },
  { header: "Reorder level", value: (level) => level.reorderLevel },
  { header: "Status", value: (level) => STOCK_STATE[stockState(level)].label },
  { header: "Unit cost (NGN)", value: (level) => level.item.unitCost },
  { header: "Value (NGN)", value: valueOf },
];

/** What's on screen, with the current filters, every figure in full. */
function exportStock(levels: StockLevel[]) {
  downloadCsv(`stock-${toISODate(new Date())}.csv`, levels, EXPORT_COLUMNS);
  toast.success(`Exported ${formatCount(levels.length, "stock line")}`, {
    description: "Quantities, unit costs and values, ready for a spreadsheet.",
  });
}
