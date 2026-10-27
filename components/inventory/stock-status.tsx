import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { StockLevel } from "@/lib/api/types";

export type StockState = "out" | "critical" | "low" | "ok";

/**
 * How worried to be about a stock level. Below the reorder level it's low;
 * below half of it, critical: at that point a delivery that's late by a day
 * or two stops work.
 */
export function stockState(item: Pick<StockLevel, "quantity" | "reorderLevel">): StockState {
  if (item.quantity <= 0) return "out";
  if (item.quantity < item.reorderLevel / 2) return "critical";
  if (item.quantity < item.reorderLevel) return "low";
  return "ok";
}

export const STOCK_STATE: Record<StockState, { label: string; tone: BadgeTone }> = {
  out: { label: "Out of stock", tone: "danger" },
  critical: { label: "Critical", tone: "danger" },
  low: { label: "Low", tone: "warning" },
  ok: { label: "OK", tone: "success" },
};

/** Most urgent first: how much is left as a share of the reorder level. */
export const byUrgency = (
  a: Pick<StockLevel, "quantity" | "reorderLevel">,
  b: Pick<StockLevel, "quantity" | "reorderLevel">,
) => a.quantity / a.reorderLevel - b.quantity / b.reorderLevel;

export function StockStateBadge({ item }: { item: Pick<StockLevel, "quantity" | "reorderLevel"> }) {
  const { label, tone } = STOCK_STATE[stockState(item)];
  return <Badge tone={tone}>{label}</Badge>;
}
