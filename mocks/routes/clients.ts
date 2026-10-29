import type { Router } from "../router";

export function registerClientRoutes(router: Router) {
  // Only what an invoice needs so far; the Clients module adds the rest.
  router.get("/clients", ({ db }) => [...db.clients].sort((a, b) => a.name.localeCompare(b.name)));
}
