import type { WorkspaceCounts } from "@/lib/api/types";
import type { Router } from "../router";
import { pendingApprovals } from "./dashboard";

export function registerMeRoutes(router: Router) {
  router.get("/me", ({ db }) => db.currentUser);

  router.get("/me/counts", ({ db }): WorkspaceCounts => {
    const pending = pendingApprovals(db);
    return {
      inventory: pending.material_request + pending.purchase_order,
      staff: pending.timesheet,
      unreadNotifications: db.notifications.filter((n) => !n.read).length,
    };
  });

  router.get("/me/notifications", ({ db }) =>
    [...db.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );

  // A write: changes the in-memory data, so the next GET sees it.
  router.post("/me/notifications/read-all", ({ db }) => {
    for (const notification of db.notifications) notification.read = true;
  });
}
