import { apiFetch, type ApiRequest } from "@/lib/api/client";
import type { SearchResult } from "@/lib/api/types";

/** GET /search?q= : projects, invoices, equipment, stock and people, best matches first. */
export function search(q: string, options?: Pick<ApiRequest, "signal">) {
  return apiFetch<SearchResult[]>("/search", { ...options, query: { q } });
}
