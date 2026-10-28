import { apiFetch, type ApiRequest } from "@/lib/api/client";
import type { Supplier } from "@/lib/api/types";

type Options = Pick<ApiRequest, "signal">;

/** GET /suppliers */
export function listSuppliers(options?: Options) {
  return apiFetch<Supplier[]>("/suppliers", options);
}
