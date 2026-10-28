"use client";

import { useIsMutating, useSuspenseQueries } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { QueryBoundary } from "@/components/data/query-boundary";
import { formatQuantity, unitDecimals } from "@/components/inventory/inventory-status";
import {
  NOTES_LIMIT,
  previewTotals,
  toPurchaseOrderInput,
  validatePurchaseOrder,
  type DraftErrors,
  type PurchaseOrderDraft,
} from "@/components/inventory/purchase-order-rules";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, focusFirstInvalid } from "@/components/ui/field";
import { Input, MoneyInput, NumberInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";
import type { StockItem } from "@/lib/api/types";
import { formatMoney, formatMoneyCompact, formatPercent, toISODate } from "@/lib/format";
import {
  CREATE_PURCHASE_ORDER,
  inventoryQueries,
  useCreatePurchaseOrder,
} from "@/lib/queries/inventory";
import { supplierQueries } from "@/lib/queries/suppliers";
import { useUiStore, type PurchaseOrderPrefill } from "@/store/ui.store";

/**
 * The new purchase order drawer. It lives in the app shell, so it opens over
 * whatever page asked for it: Inventory's button or a stock row's Order, the
 * dashboard's Reorder, or "New purchase order" in the palette.
 */
export function PurchaseOrderSheet() {
  const open = useUiStore((state) => state.purchaseOrderOpen);
  const setOpen = useUiStore((state) => state.setPurchaseOrderOpen);
  // Closing mid-submit would hide the answer, so the drawer waits for it.
  const sending = useIsMutating({ mutationKey: CREATE_PURCHASE_ORDER }) > 0;

  return (
    <Sheet open={open} onOpenChange={(next) => (sending ? undefined : setOpen(next))}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>New purchase order</SheetTitle>
          <SheetDescription>It gets its number when you submit it.</SheetDescription>
        </SheetHeader>
        {/* Mounted only while open, so every order starts from a fresh draft. */}
        <QueryBoundary fallback={<FormSkeleton />}>
          <PurchaseOrderForm onDone={() => setOpen(false)} />
        </QueryBoundary>
      </SheetContent>
    </Sheet>
  );
}

function FormSkeleton() {
  return (
    <SheetBody>
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-control" />
        </div>
      ))}
    </SheetBody>
  );
}

/** Option groups for a select, one per category, in the order they first appear. */
function byCategory<T extends { category: string }>(entries: T[]): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const entry of entries) {
    groups.set(entry.category, [...(groups.get(entry.category) ?? []), entry]);
  }
  return [...groups];
}

function initialDraft(prefill: PurchaseOrderPrefill, items: StockItem[]): PurchaseOrderDraft {
  const item = items.find((entry) => entry.id === prefill.itemId);
  return {
    supplierId: "",
    deliverToId: prefill.deliverToId ?? "",
    itemId: item?.id ?? "",
    quantity: prefill.quantity ? String(prefill.quantity) : "",
    unitPrice: item ? String(item.unitCost) : "",
    expectedDelivery: "",
    notes: "",
  };
}

function PurchaseOrderForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const prefill = useUiStore((state) => state.purchaseOrderPrefill);
  const [
    { data: suppliers },
    { data: locations },
    { data: items },
    { data: stock },
    { data: settings },
  ] = useSuspenseQueries({
    queries: [
      supplierQueries.list(),
      inventoryQueries.locations(),
      inventoryQueries.items(),
      inventoryQueries.stock(),
      inventoryQueries.purchasingSettings(),
    ],
  });
  const create = useCreatePurchaseOrder();

  const [draft, setDraft] = useState(() => initialDraft(prefill, items));
  const [errors, setErrors] = useState<DraftErrors>({});
  const [refusal, setRefusal] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const today = toISODate(new Date());

  const item = items.find((entry) => entry.id === draft.itemId);
  const level = stock.find(
    (entry) => entry.item.id === draft.itemId && entry.location.id === draft.deliverToId,
  );
  const store = locations.find((entry) => entry.id === draft.deliverToId);
  const totals = previewTotals(draft, settings.vatRate);
  const needsApproval = totals !== null && totals.total > settings.approvalThreshold;

  const update = <K extends keyof PurchaseOrderDraft>(key: K, value: PurchaseOrderDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    // A field's message goes as soon as it's being fixed.
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  };

  // Picking an item fills in the last price paid for it, unless a price of
  // someone's own is already there.
  const chooseItem = (itemId: string) => {
    const next = items.find((entry) => entry.id === itemId);
    const previous = items.find((entry) => entry.id === draft.itemId);
    const priceIsDefault = draft.unitPrice === "" || draft.unitPrice === String(previous?.unitCost);
    update("itemId", itemId);
    if (next && priceIsDefault) update("unitPrice", String(next.unitCost));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setRefusal(null);
    const found = validatePurchaseOrder(draft, { today, items, suppliers });
    if (Object.keys(found).length > 0) {
      setErrors(found);
      focusFirstInvalid(form.current ?? document);
      return;
    }
    create.mutate(toPurchaseOrderInput(draft), {
      onSuccess: (order) => {
        onDone();
        toast.success(
          order.status === "awaiting_approval"
            ? `${order.code} sent to ${settings.approver.name} for approval`
            : `${order.code} placed with ${order.supplier.name}`,
          {
            description: `${formatMoney(order.total)} · delivery to ${order.deliverTo.name}`,
            action: { label: "View", onClick: () => router.push("/inventory/orders") },
          },
        );
      },
      onError: (error) =>
        setRefusal(
          error instanceof ApiError
            ? error.message
            : "The order couldn't be sent. Check your connection and try again.",
        ),
    });
  };

  const money = (amount: number) => formatMoney(amount, { kobo: !Number.isInteger(amount) });

  return (
    <form ref={form} onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <SheetBody>
        <Field label="Supplier" required error={errors.supplierId}>
          <Select
            value={draft.supplierId}
            onChange={(event) => update("supplierId", event.target.value)}
          >
            <option value="" disabled>
              Choose a supplier
            </option>
            {byCategory(suppliers).map(([category, entries]) => (
              <optgroup key={category} label={category}>
                {entries.map((supplier) => (
                  <option
                    key={supplier.id}
                    value={supplier.id}
                    disabled={supplier.status === "blocked"}
                  >
                    {supplier.name}
                    {supplier.status === "blocked" && " (blocked)"}
                    {supplier.status === "under_review" && " (under review)"}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>

        <Field label="Deliver to" required error={errors.deliverToId}>
          <Select
            value={draft.deliverToId}
            onChange={(event) => update("deliverToId", event.target.value)}
          >
            <option value="" disabled>
              Choose a store
            </option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-[3fr_2fr]">
          <Field label="Item" required error={errors.itemId}>
            <Select value={draft.itemId} onChange={(event) => chooseItem(event.target.value)}>
              <option value="" disabled>
                Choose an item
              </option>
              {byCategory(items).map(([category, entries]) => (
                <optgroup key={category} label={category}>
                  {entries.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
          <Field
            label="Quantity"
            required
            error={errors.quantity}
            hint={
              item && store
                ? level
                  ? `${formatQuantity(level.quantity, item.unit)} there now; reorder at ${formatQuantity(level.reorderLevel, item.unit)}`
                  : `None at ${store.name} yet`
                : undefined
            }
          >
            <NumberInput
              value={draft.quantity}
              onValueChange={(value) => update("quantity", value)}
              decimals={item ? unitDecimals(item.unit) : 2}
              suffix={item?.unit}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Unit price"
            required
            error={errors.unitPrice}
            hint={item ? `Last paid ${formatMoney(item.unitCost)}` : undefined}
          >
            <MoneyInput
              value={draft.unitPrice}
              onValueChange={(value) => update("unitPrice", value)}
            />
          </Field>
          <Field label="Expected delivery" error={errors.expectedDelivery}>
            <Input
              type="date"
              min={today}
              value={draft.expectedDelivery}
              onChange={(event) => update("expectedDelivery", event.target.value)}
            />
          </Field>
        </div>

        <Field
          label="Notes for the supplier"
          error={errors.notes}
          hint={`${draft.notes.length} of ${NOTES_LIMIT} characters`}
        >
          <Textarea
            value={draft.notes}
            maxLength={NOTES_LIMIT}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Delivery window, gate contact, offloading…"
          />
        </Field>

        <dl className="flex flex-col gap-2 rounded-lg border border-line px-4 py-3.5 text-md tabular-nums">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-3">Subtotal</dt>
            <dd>{totals ? money(totals.subtotal) : "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-3">VAT {formatPercent(settings.vatRate, { decimals: 1 })}</dt>
            <dd>{totals ? money(totals.vat) : "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line pt-2 font-semibold">
            <dt>Total</dt>
            <dd>{totals ? money(totals.total) : "—"}</dd>
          </div>
        </dl>

        <Alert tone={needsApproval ? "warning" : "info"}>
          {needsApproval
            ? `Over ${formatMoneyCompact(settings.approvalThreshold)}, so ${settings.approver.name} approves it before it goes to the supplier.`
            : `Up to ${formatMoneyCompact(settings.approvalThreshold)}, an order goes straight to the supplier. Over that, ${settings.approver.name} approves it first.`}
        </Alert>

        {refusal && (
          <Alert tone="danger" role="alert" title="The order wasn't sent">
            {refusal}
          </Alert>
        )}
      </SheetBody>

      <SheetFooter>
        <SheetClose asChild>
          <Button disabled={create.isPending}>Cancel</Button>
        </SheetClose>
        <Button type="submit" variant="primary" loading={create.isPending}>
          {needsApproval ? "Submit for approval" : "Place order"}
        </Button>
      </SheetFooter>
    </form>
  );
}
