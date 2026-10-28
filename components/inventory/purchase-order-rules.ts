import type { PurchaseOrderInput, StockItem, Supplier } from "@/lib/api/types";
import { parseNumber } from "@/lib/utils";

/** What the form holds while it's filled in: text, exactly as typed or picked. */
export interface PurchaseOrderDraft {
  supplierId: string;
  deliverToId: string;
  itemId: string;
  quantity: string;
  unitPrice: string;
  /** "2026-10-30", or "" for not given. */
  expectedDelivery: string;
  notes: string;
}

export type DraftErrors = Partial<Record<keyof PurchaseOrderDraft, string>>;

export const NOTES_LIMIT = 500;

/**
 * Checks a draft before it's sent: one message per field, in words that say
 * what to do. It runs on every submit even though the controls already stop
 * most mistakes (letters can't be typed into a quantity, a past date can't be
 * picked), because a rule that only lives in a control is one paste away from
 * being skipped.
 *
 * The server checks all of this again; it has to, since anything can send it a
 * request. These are the same rules, here so the form can say what's wrong
 * before it asks.
 */
export function validatePurchaseOrder(
  draft: PurchaseOrderDraft,
  { today, items, suppliers }: { today: string; items: StockItem[]; suppliers: Supplier[] },
): DraftErrors {
  const errors: DraftErrors = {};

  const supplier = suppliers.find((entry) => entry.id === draft.supplierId);
  if (!supplier) errors.supplierId = "Choose a supplier.";
  else if (supplier.status === "blocked") {
    errors.supplierId = `${supplier.name} is blocked, so it can't take new orders.`;
  }

  if (!draft.deliverToId) errors.deliverToId = "Choose where it should be delivered.";

  const item = items.find((entry) => entry.id === draft.itemId);
  if (!item) errors.itemId = "Choose an item.";

  const quantity = parseNumber(draft.quantity);
  if (quantity === null || quantity <= 0) {
    errors.quantity = item ? `Enter how many ${item.unit}.` : "Enter a quantity.";
  }

  if (parseNumber(draft.unitPrice) === null) errors.unitPrice = "Enter the price per unit.";

  if (draft.expectedDelivery && draft.expectedDelivery < today) {
    errors.expectedDelivery = "Pick today or a later date.";
  }

  if (draft.notes.trim().length > NOTES_LIMIT) {
    errors.notes = `Keep it to ${NOTES_LIMIT} characters.`;
  }

  return errors;
}

/**
 * The request body for a draft that passed `validatePurchaseOrder`. Optional
 * fields left blank are left out rather than sent as "".
 */
export function toPurchaseOrderInput(draft: PurchaseOrderDraft): PurchaseOrderInput {
  const notes = draft.notes.trim();
  return {
    supplierId: draft.supplierId,
    deliverToId: draft.deliverToId,
    lines: [
      {
        itemId: draft.itemId,
        quantity: parseNumber(draft.quantity) ?? 0,
        unitPrice: parseNumber(draft.unitPrice) ?? 0,
      },
    ],
    ...(draft.expectedDelivery && { expectedDelivery: draft.expectedDelivery }),
    ...(notes && { notes }),
  };
}

/**
 * Subtotal, VAT and total as the draft stands, to the kobo, the way the server
 * works them out. Only a preview: the order's real figures are the ones the
 * server sends back. Null until there's both a quantity and a price.
 */
export function previewTotals(
  draft: Pick<PurchaseOrderDraft, "quantity" | "unitPrice">,
  vatRate: number,
): { subtotal: number; vat: number; total: number } | null {
  const quantity = parseNumber(draft.quantity);
  const unitPrice = parseNumber(draft.unitPrice);
  if (quantity === null || unitPrice === null) return null;
  const subtotal = Math.round(quantity * unitPrice * 100);
  const vat = Math.round(subtotal * vatRate);
  return { subtotal: subtotal / 100, vat: vat / 100, total: (subtotal + vat) / 100 };
}
