import { apiFetch, type ApiRequest } from "@/lib/api/client";
import type { DashboardSummary } from "@/lib/api/types";

/**
 * GET /dashboard/summary: the dashboard's figures in one round trip.
 *
 * An aggregate endpoint rather than one call per tile: the server can total
 * receivables or count overdue invoices in a single query, and the dashboard
 * doesn't fire eight requests on load.
 */
export function getDashboardSummary(options?: Pick<ApiRequest, "signal">) {
  return apiFetch<DashboardSummary>("/dashboard/summary", options);
}
