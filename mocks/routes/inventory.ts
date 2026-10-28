import type {
  MaterialRequest,
  PurchaseOrder,
  PurchaseOrderLine,
  StockLevel,
} from "@/lib/api/types";
import { created, HttpError, intParam, type Router } from "../router";
import { orderTotals, type Db, type StockLevelRecord } from "../seed";
import { lagosDay } from "../time";

const me = (db: Db) => ({ id: db.currentUser.id, name: db.currentUser.name });

/** A stock level with its catalogue item in full, so a row needs no second request. */
function toStockLevel(db: Db, level: StockLevelRecord): StockLevel {
  return {
    id: level.id,
    item: db.stockItems.find((entry) => entry.id === level.itemId)!,
    location: level.location,
    quantity: level.quantity,
    reorderLevel: level.reorderLevel,
  };
}

/** Rejects the request with a 400 the form can show as it is. */
function invalid(message: string): never {
  throw new HttpError(400, "validation_failed", message);
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/**
 * Reads and checks the body of a new purchase order. The browser checks the
 * same things before it sends anything, but the server can't rely on that:
 * any program can send a request. The first problem found comes back as a 400
 * in words a person can act on.
 */
function readOrder(db: Db, body: unknown, today: string) {
  if (!isRecord(body)) invalid("Send the order as a JSON object.");

  const supplier =
    db.suppliers.find((entry) => entry.id === body.supplierId) ?? invalid("Choose a supplier.");
  if (supplier.status === "blocked") {
    invalid(`${supplier.name} is blocked, so it can't be sent new orders.`);
  }

  const deliverTo =
    db.locations.find((entry) => entry.id === body.deliverToId) ??
    invalid("Choose where it should be delivered.");

  if (!Array.isArray(body.lines) || body.lines.length === 0) invalid("Add at least one item.");
  const lines = body.lines.map((raw: unknown): PurchaseOrderLine => {
    const entry = isRecord(raw) ? raw : {};
    const item =
      db.stockItems.find((candidate) => candidate.id === entry.itemId) ??
      invalid("Choose items from the catalogue.");
    if (!isAmount(entry.quantity) || entry.quantity <= 0) {
      invalid(`Enter how many ${item.unit} of ${item.name} to order.`);
    }
    if (!isAmount(entry.unitPrice) || entry.unitPrice < 0) {
      invalid(`Enter a unit price for ${item.name}.`);
    }
    return {
      item: { id: item.id, name: item.name, unit: item.unit },
      quantity: entry.quantity,
      unitPrice: entry.unitPrice,
      received: 0,
    };
  });

  let expectedDelivery: string | null = null;
  if (body.expectedDelivery !== undefined) {
    const date = body.expectedDelivery;
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      invalid("Expected delivery must be a date, like 2026-10-30.");
    }
    if (date < today) invalid("Expected delivery can't be in the past.");
    expectedDelivery = date;
  }

  let notes: string | null = null;
  if (body.notes !== undefined) {
    if (typeof body.notes !== "string") invalid("Notes must be text.");
    if (body.notes.trim().length > 500) invalid("Keep notes to 500 characters.");
    notes = body.notes.trim() || null;
  }

  return { supplier, deliverTo, lines, expectedDelivery, notes };
}

function findOrder(db: Db, id: string | undefined): PurchaseOrder {
  const order = db.purchaseOrders.find((entry) => entry.id === id);
  if (!order) throw new HttpError(404, "not_found", "There's no purchase order with that id.");
  return order;
}

/** Approve or reject: one-way moves out of "pending", hence actions and 409s (as with variation orders). */
function decideRequest(
  db: Db,
  id: string | undefined,
  status: "approved" | "rejected",
  now: Date,
): MaterialRequest {
  const request = db.materialRequests.find((entry) => entry.id === id);
  if (!request) throw new HttpError(404, "not_found", "There's no material request with that id.");
  if (request.status !== "pending") {
    throw new HttpError(
      409,
      "already_decided",
      `${request.code} has already been ${request.status}.`,
    );
  }
  request.status = status;
  request.decidedBy = me(db);
  request.decidedAt = now.toISOString();
  return request;
}

function decideOrder(
  db: Db,
  id: string | undefined,
  decision: "approve" | "reject",
  now: Date,
): PurchaseOrder {
  const order = findOrder(db, id);
  if (order.status !== "awaiting_approval") {
    throw new HttpError(
      409,
      "already_decided",
      `${order.code} isn't waiting for approval any more.`,
    );
  }
  // Approved means it goes to the supplier.
  order.status = decision === "approve" ? "ordered" : "rejected";
  order.decidedBy = me(db);
  order.decidedAt = now.toISOString();
  return order;
}

export function registerInventoryRoutes(router: Router) {
  // Stock levels, optionally at one store.
  router.get("/stock", ({ db, query }) => {
    const locationId = query.get("locationId");
    return db.stock
      .filter((level) => !locationId || level.location.id === locationId)
      .map((level) => toStockLevel(db, level));
  });

  router.get("/stock-items", ({ db }) => db.stockItems);

  router.get("/locations", ({ db }) => db.locations);

  // Newest first.
  router.get("/stock-movements", ({ db, query }) => {
    const limit = intParam(query, "limit", { fallback: 50, min: 1, max: 200 });
    return [...db.stockMovements].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
  });

  router.get("/purchasing/settings", ({ db }) => db.purchasing);

  // Waiting ones first, soonest needed first; then the decided ones, newest first.
  router.get("/material-requests", ({ db }) => {
    const pending = db.materialRequests
      .filter((request) => request.status === "pending")
      .sort((a, b) => a.neededBy.localeCompare(b.neededBy));
    const decided = db.materialRequests
      .filter((request) => request.status !== "pending")
      .sort((a, b) => (b.decidedAt ?? "").localeCompare(a.decidedAt ?? ""));
    return [...pending, ...decided];
  });

  router.post("/material-requests/:id/approve", ({ db, params, now }) =>
    decideRequest(db, params.id, "approved", now),
  );

  router.post("/material-requests/:id/reject", ({ db, params, now }) =>
    decideRequest(db, params.id, "rejected", now),
  );

  // Newest first.
  router.get("/purchase-orders", ({ db }) =>
    [...db.purchaseOrders].sort((a, b) => b.raisedAt.localeCompare(a.raisedAt)),
  );

  router.get("/purchase-orders/:id", ({ db, params }) => findOrder(db, params.id));

  /*
   * A new order. The server decides everything a client could get wrong or
   * fake: the number, the totals, who raised it, and whether it needs
   * approval (over the threshold) or goes straight to the supplier.
   */
  router.post("/purchase-orders", ({ db, body, now }) => {
    const { supplier, deliverTo, lines, expectedDelivery, notes } = readOrder(
      db,
      body,
      lagosDay(now),
    );
    const totals = orderTotals(lines, db.purchasing.vatRate);
    db.sequences.purchaseOrder += 1;
    const number = String(db.sequences.purchaseOrder).padStart(4, "0");

    const order: PurchaseOrder = {
      id: `po_${number}`,
      code: `PO-${lagosDay(now).slice(0, 4)}-${number}`,
      supplier: { id: supplier.id, name: supplier.name },
      deliverTo: { id: deliverTo.id, name: deliverTo.name },
      lines,
      ...totals,
      status: totals.total > db.purchasing.approvalThreshold ? "awaiting_approval" : "ordered",
      raisedBy: me(db),
      raisedAt: now.toISOString(),
      expectedDelivery,
      notes,
      decidedBy: null,
      decidedAt: null,
    };
    db.purchaseOrders.push(order);
    return created(order, `/purchase-orders/${order.id}`);
  });

  router.post("/purchase-orders/:id/approve", ({ db, params, now }) =>
    decideOrder(db, params.id, "approve", now),
  );

  router.post("/purchase-orders/:id/reject", ({ db, params, now }) =>
    decideOrder(db, params.id, "reject", now),
  );
}
