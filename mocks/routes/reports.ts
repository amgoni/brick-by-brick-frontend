import { intParam, type Router } from "../router";

export function registerReportRoutes(router: Router) {
  // Precomputed in the seed. The real backend will total invoices and
  // payments by month in SQL (GROUP BY), which is the interesting part.
  router.get("/reports/cash-flow", ({ db, query }) => {
    const months = intParam(query, "months", { fallback: 12, min: 1, max: 12 });
    return db.cashFlow.slice(-months);
  });
}
