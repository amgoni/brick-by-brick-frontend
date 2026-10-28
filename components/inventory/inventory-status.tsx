import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import type {
  MaterialRequestStatus,
  PurchaseOrder,
  PurchaseOrderStatus,
  StockLevel,
  StockMovementKind,
} from "@/lib/api/types";
import { formatNumber } from "@/lib/format";

/*
 * The inventory module's vocabulary: what each state is called on screen and
 * which badge tone it takes, and the few rules about stock the screens share.
 */

export interface StatusView {
  label: string;
  tone: BadgeTone;
}

type Level = Pick<StockLevel, "quantity" | "reorderLevel">;

export type StockState = "out" | "critical" | "low" | "ok";

/**
 * Below the reorder level it's low; below half of it, critical: at that point
 * a delivery that's a day or two late stops work.
 */
export function stockState(level: Level): StockState {
  if (level.quantity <= 0) return "out";
  if (level.quantity < level.reorderLevel / 2) return "critical";
  if (level.quantity < level.reorderLevel) return "low";
  return "ok";
}

export const isBelowReorder = (level: Level) => level.quantity < level.reorderLevel;

export const STOCK_STATE: Record<StockState, StatusView> = {
  out: { label: "Out of stock", tone: "danger" },
  critical: { label: "Critical", tone: "danger" },
  low: { label: "Low", tone: "warning" },
  ok: { label: "In stock", tone: "success" },
};

/** Most urgent first: how much is left as a share of the reorder level. */
export const byUrgency = (a: Level, b: Level) =>
  a.quantity / a.reorderLevel - b.quantity / b.reorderLevel;

export function StockStateBadge({ level }: { level: Level }) {
  const { label, tone } = STOCK_STATE[stockState(level)];
  return <Badge tone={tone}>{label}</Badge>;
}

/**
 * A sensible amount to order: back up to twice the reorder level when it's
 * low, one reorder level's worth otherwise. Whole units; the form can change it.
 */
export function suggestedOrder(level: Level): number {
  return Math.max(
    1,
    Math.ceil(isBelowReorder(level) ? level.reorderLevel * 2 - level.quantity : level.reorderLevel),
  );
}

/** Units that only come whole. Tonnes and square metres can be split. */
const WHOLE_UNITS = new Set(["bags", "pcs", "sheets", "lengths", "rolls", "pails"]);

/** How many decimals a quantity in this unit takes: 0 for bags, 2 for tonnes. */
export const unitDecimals = (unit: string) => (WHOLE_UNITS.has(unit) ? 0 : 2);

/** "38 bags", "6.2 t" */
export const formatQuantity = (quantity: number, unit: string) =>
  `${formatNumber(quantity, { decimals: unitDecimals(unit) })} ${unit}`;

export const REQUEST_STATUS: Record<MaterialRequestStatus, StatusView> = {
  pending: { label: "Waiting", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

export const ORDER_STATUS: Record<PurchaseOrderStatus, StatusView> = {
  awaiting_approval: { label: "Awaiting approval", tone: "warning" },
  ordered: { label: "Ordered", tone: "info" },
  part_delivered: { label: "Part delivered", tone: "info" },
  received: { label: "Received", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

/** "Cement 42.5R (50kg bag) × 1,000 bags", and "+1 more" when there are other lines. */
export function describeOrderLines(order: Pick<PurchaseOrder, "lines">): string {
  const [first, ...rest] = order.lines;
  if (!first) return "No items";
  const text = `${first.item.name} × ${formatQuantity(first.quantity, first.item.unit)}`;
  return rest.length > 0 ? `${text} +${rest.length} more` : text;
}

export const MOVEMENT_KIND: Record<StockMovementKind, { label: string; icon: LucideIcon }> = {
  issue: { label: "Issued", icon: ArrowUpRight },
  receipt: { label: "Received", icon: ArrowDownLeft },
  transfer: { label: "Transfer", icon: ArrowLeftRight },
  adjustment: { label: "Adjustment", icon: SlidersHorizontal },
};
