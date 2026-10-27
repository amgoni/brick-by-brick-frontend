import { apiFetch, type ApiRequest } from "@/lib/api/client";
import type { CashFlowMonth } from "@/lib/api/types";

/** GET /reports/cash-flow?months= : oldest month first, ending with this one. */
export function getCashFlow(params: { months: number }, options?: Pick<ApiRequest, "signal">) {
  return apiFetch<CashFlowMonth[]>("/reports/cash-flow", { ...options, query: params });
}
