"use client";

import { ArrowLeftRight } from "lucide-react";
import { QueryBoundary } from "@/components/data/query-boundary";
import { formatQuantity, MOVEMENT_KIND } from "@/components/inventory/inventory-status";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StockMovement } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { useStockMovements } from "@/lib/queries/inventory";

/** The Movements tab: stock received, issued, moved and counted, newest first. */
export function StockMovements() {
  return (
    <Card>
      <QueryBoundary fallback={<TableSkeleton rows={6} columns={6} />}>
        <MovementList />
      </QueryBoundary>
    </Card>
  );
}

/** "+30 t", "−24 bags"; a transfer only moves stock, so it has no sign. */
function change(movement: StockMovement): string {
  const { quantity, item } = movement;
  const amount = formatQuantity(Math.abs(quantity), item.unit);
  if (movement.kind === "transfer") return amount;
  return `${quantity < 0 ? "−" : "+"}${amount}`;
}

/** "Lekki Palms store → Blockwork L5" */
const route = (movement: StockMovement) =>
  [movement.from, movement.to].filter(Boolean).join(" → ") || "—";

/** A document number (PO-2026-0231) rather than words ("Stock count"). */
const isCode = (text: string) => /^[A-Z]{2,4}-[\d-]+$/.test(text);

/** "ISS-1188", or "GRN-0907 · PO-2026-0231" when it was done against something. Codes in mono. */
function Documents({ movement }: { movement: StockMovement }) {
  return (
    <>
      <span className="font-mono text-xs">{movement.code}</span>
      {movement.reference && (
        <>
          {" · "}
          <span className={isCode(movement.reference) ? "font-mono text-xs" : undefined}>
            {movement.reference}
          </span>
        </>
      )}
    </>
  );
}

function KindIcon({ movement }: { movement: StockMovement }) {
  const { icon: Icon } = MOVEMENT_KIND[movement.kind];
  return (
    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-line text-ink-2">
      <Icon aria-hidden="true" />
    </span>
  );
}

function MovementList() {
  const { data: movements } = useStockMovements({ limit: 100 });
  const now = new Date();

  if (movements.length === 0) {
    return (
      <EmptyState
        icon={<ArrowLeftRight />}
        title="No movements yet"
        description="Deliveries, issues to site, transfers and stock counts show here as they happen."
      />
    );
  }

  return (
    <>
      <ul className="md:hidden">
        {movements.map((movement) => (
          <li
            key={movement.id}
            className="flex items-start gap-3 border-b border-line px-4.5 py-3.5 last:border-b-0"
          >
            <KindIcon movement={movement} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">
                  {MOVEMENT_KIND[movement.kind].label} · {movement.item.name}
                </span>
                <span className="shrink-0 font-medium tabular-nums">{change(movement)}</span>
              </div>
              <p className="text-sm text-ink-2">{route(movement)}</p>
              <p className="text-sm text-ink-3">
                <time dateTime={movement.at}>{formatDateTime(movement.at, now)}</time> ·{" "}
                {movement.by.name} · <Documents movement={movement} />
              </p>
            </div>
          </li>
        ))}
      </ul>

      <Table className="min-w-240 max-md:hidden">
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Item</TableHead>
            <TableHead numeric>Quantity</TableHead>
            <TableHead>From → to</TableHead>
            <TableHead>By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell className="whitespace-nowrap text-ink-2 tabular-nums">
                <time dateTime={movement.at}>{formatDateTime(movement.at, now)}</time>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-2">
                  <KindIcon movement={movement} />
                  {MOVEMENT_KIND[movement.kind].label}
                </span>
              </TableCell>
              <TableCell className="py-2.5">
                <div className="font-medium">{movement.item.name}</div>
                <div className="text-sm text-ink-3">
                  <Documents movement={movement} />
                </div>
              </TableCell>
              <TableCell numeric className="font-medium">
                {change(movement)}
              </TableCell>
              <TableCell className="text-ink-2">{route(movement)}</TableCell>
              <TableCell className="text-ink-2">{movement.by.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
