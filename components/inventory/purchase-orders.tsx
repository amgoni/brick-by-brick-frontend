"use client";

import { Plus, ShoppingCart } from "lucide-react";
import {
  ConfirmDecisionDialog,
  DecisionButtons,
  decided,
  toastDecisionFailed,
  useConfirmDecision,
} from "@/components/approvals/decision";
import { QueryBoundary } from "@/components/data/query-boundary";
import {
  describeOrderLines,
  formatQuantity,
  ORDER_STATUS,
  unitDecimals,
} from "@/components/inventory/inventory-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { toast } from "@/components/ui/toast";
import type { PurchaseOrder } from "@/lib/api/types";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { useDecidePurchaseOrder, usePurchaseOrders } from "@/lib/queries/inventory";
import { useUiStore } from "@/store/ui.store";

/** The Purchase orders tab: every order to a supplier, from approval to delivery. */
export function PurchaseOrders() {
  return (
    <Card>
      <QueryBoundary fallback={<TableSkeleton rows={4} columns={6} />}>
        <OrderList />
      </QueryBoundary>
    </Card>
  );
}

const amount = (value: number) => formatMoney(value, { kobo: !Number.isInteger(value) });

/** "Raised 25 Oct by Bisi Alade" */
const raised = (order: PurchaseOrder) =>
  `Raised ${formatDate(order.raisedAt, "short")} by ${order.raisedBy.name}`;

/** "30 of 60 t received", once anything has arrived. */
function deliveryNote(order: PurchaseOrder): string | null {
  if (order.status !== "part_delivered" && order.status !== "received") return null;
  const line = order.lines[0];
  if (!line) return null;
  const received = formatNumber(line.received, { decimals: unitDecimals(line.item.unit) });
  return `${received} of ${formatQuantity(line.quantity, line.item.unit)} received`;
}

function OrderList() {
  const { data: orders } = usePurchaseOrders();
  const openPurchaseOrder = useUiStore((state) => state.openPurchaseOrder);

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart />}
        title="No purchase orders yet"
        description="Orders to suppliers show here, from approval to delivery."
        action={
          <Button size="sm" onClick={() => openPurchaseOrder()}>
            <Plus />
            New purchase order
          </Button>
        }
      />
    );
  }

  return (
    <>
      <ul className="md:hidden">
        {orders.map((order) => {
          const status = ORDER_STATUS[order.status];
          const delivery = deliveryNote(order);
          return (
            <li
              key={order.id}
              className="flex flex-col gap-1 border-b border-line px-4.5 py-3.5 last:border-b-0"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-medium">{order.supplier.name}</span>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>
              <p className="text-sm text-ink-3">
                <span className="font-mono text-xs">{order.code}</span> · {raised(order)}
              </p>
              <p className="text-md">{describeOrderLines(order)}</p>
              {delivery && <p className="text-sm text-ink-3">{delivery}</p>}
              <div className="flex items-baseline justify-between gap-3 text-md">
                <span className="text-ink-2">To {order.deliverTo.name}</span>
                <span className="font-medium tabular-nums">{amount(order.total)}</span>
              </div>
              {order.status === "awaiting_approval" && (
                <div className="mt-1.5 flex justify-end">
                  <OrderDecision order={order} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <Table className="min-w-245 max-md:hidden">
        <TableHeader>
          <TableRow>
            <TableHead>PO number</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Deliver to</TableHead>
            <TableHead numeric>Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const status = ORDER_STATUS[order.status];
            const delivery = deliveryNote(order);
            return (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm whitespace-nowrap text-ink-2">
                  {order.code}
                </TableCell>
                <TableCell className="py-2.5">
                  <div className="font-medium">{order.supplier.name}</div>
                  <div className="text-sm text-ink-3">{raised(order)}</div>
                </TableCell>
                <TableCell>
                  <div>{describeOrderLines(order)}</div>
                  {delivery && <div className="text-sm text-ink-3">{delivery}</div>}
                </TableCell>
                <TableCell className="text-ink-2">{order.deliverTo.name}</TableCell>
                <TableCell numeric className="font-medium">
                  {amount(order.total)}
                </TableCell>
                {/* Waiting orders get their decision under the badge: no column to spare. */}
                <TableCell className="py-2.5">
                  <div className="flex flex-col items-start gap-2">
                    <Badge tone={status.tone}>{status.label}</Badge>
                    <OrderDecision order={order} />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}

/** Approve or reject an order over the threshold. It's money leaving the company, so it asks first. */
function OrderDecision({ order }: { order: PurchaseOrder }) {
  const { decision, open, setOpen, ask } = useConfirmDecision();
  const decide = useDecidePurchaseOrder();
  if (order.status !== "awaiting_approval") return null;

  const confirm = () =>
    decide.mutate(
      { id: order.id, decision },
      {
        onSuccess: (updated) => {
          setOpen(false);
          toast.success(`${updated.code} ${decided(decision)}`, {
            description:
              decision === "approve"
                ? `On its way to ${updated.supplier.name}`
                : `${updated.supplier.name} won't receive it`,
          });
        },
        onError: (error) => toastDecisionFailed(order.code, decision, error),
      },
    );

  return (
    <>
      <DecisionButtons onDecide={ask} />
      <ConfirmDecisionDialog
        open={open}
        onOpenChange={setOpen}
        decision={decision}
        code={order.code}
        description={`${order.supplier.name} · ${describeOrderLines(order)}`}
        consequence={
          decision === "approve"
            ? `${amount(order.total)} goes to ${order.supplier.name} as an order, for delivery to ${order.deliverTo.name}.`
            : `${order.raisedBy.name}'s order won't go to ${order.supplier.name}.`
        }
        pending={decide.isPending}
        onConfirm={confirm}
      />
    </>
  );
}
