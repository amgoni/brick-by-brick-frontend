import type { Router } from "../router";

export function registerSupplierRoutes(router: Router) {
  // Only what a purchase order needs so far; the Suppliers module adds the rest.
  router.get("/suppliers", ({ db }) => db.suppliers);
}
