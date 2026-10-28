import { apiFetch, type ApiRequest } from "@/lib/api/client";
import type {
  Decision,
  MaterialRequest,
  PurchaseOrder,
  PurchaseOrderInput,
  PurchasingSettings,
  StockItem,
  StockLevel,
  StockLocation,
  StockMovement,
} from "@/lib/api/types";

type Options = Pick<ApiRequest, "signal">;

export interface ListStockParams {
  /** Only what's at this store. */
  locationId?: string;
}

/** GET /stock?locationId= */
export function listStock(params: ListStockParams = {}, options?: Options) {
  return apiFetch<StockLevel[]>("/stock", { ...options, query: { ...params } });
}

/** GET /stock-items: the catalogue. */
export function listStockItems(options?: Options) {
  return apiFetch<StockItem[]>("/stock-items", options);
}

/** GET /locations: the yard and the site stores. */
export function listLocations(options?: Options) {
  return apiFetch<StockLocation[]>("/locations", options);
}

export interface ListStockMovementsParams {
  limit?: number;
}

/** GET /stock-movements?limit= : newest first. */
export function listStockMovements(params: ListStockMovementsParams = {}, options?: Options) {
  return apiFetch<StockMovement[]>("/stock-movements", { ...options, query: { ...params } });
}

/** GET /purchasing/settings */
export function getPurchasingSettings(options?: Options) {
  return apiFetch<PurchasingSettings>("/purchasing/settings", options);
}

/** GET /material-requests: waiting ones first. */
export function listMaterialRequests(options?: Options) {
  return apiFetch<MaterialRequest[]>("/material-requests", options);
}

/** POST /material-requests/:id/approve (or /reject) → the updated request. 409 if already decided. */
export function decideMaterialRequest(id: string, decision: Decision) {
  return apiFetch<MaterialRequest>(`/material-requests/${encodeURIComponent(id)}/${decision}`, {
    method: "POST",
  });
}

/** GET /purchase-orders: newest first. */
export function listPurchaseOrders(options?: Options) {
  return apiFetch<PurchaseOrder[]>("/purchase-orders", options);
}

/**
 * POST /purchase-orders → 201 with the new order, numbered and priced by the
 * server. 400 with a message if the server won't accept it.
 */
export function createPurchaseOrder(input: PurchaseOrderInput) {
  return apiFetch<PurchaseOrder>("/purchase-orders", { method: "POST", body: input });
}

/** POST /purchase-orders/:id/approve (or /reject) → the updated order. 409 if it isn't waiting. */
export function decidePurchaseOrder(id: string, decision: Decision) {
  return apiFetch<PurchaseOrder>(`/purchase-orders/${encodeURIComponent(id)}/${decision}`, {
    method: "POST",
  });
}
