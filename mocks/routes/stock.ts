import type { StockLevel } from "@/lib/api/types";
import type { Router } from "../router";

export function registerStockRoutes(router: Router) {
  // Stock levels, optionally at one store. Prices stay out until a screen needs them.
  router.get("/stock", ({ db, query }) => {
    const locationId = query.get("locationId");
    return db.stock
      .filter((item) => !locationId || item.location.id === locationId)
      .map((item): StockLevel => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        category: item.category,
        location: item.location,
        quantity: item.quantity,
        unit: item.unit,
        reorderLevel: item.reorderLevel,
      }));
  });
}
