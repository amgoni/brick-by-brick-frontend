import { apiFetch, type ApiRequest } from "@/lib/api/client";
import type { StockLevel } from "@/lib/api/types";

type Options = Pick<ApiRequest, "signal">;

export interface ListStockParams {
  /** Only what's at this store. */
  locationId?: string;
}

/** GET /stock?locationId= */
export function listStock(params: ListStockParams = {}, options?: Options) {
  return apiFetch<StockLevel[]>("/stock", { ...options, query: { ...params } });
}
