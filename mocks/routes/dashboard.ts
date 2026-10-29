import type { ApprovalKind, AttentionItem, DashboardSummary, UnitStatus } from "@/lib/api/types";
import type { Router } from "../router";
import { balanceOf, dueOn } from "../invoicing";
import type { Db } from "../seed";
import { lagosDay } from "../time";

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/**
 * What's waiting for a decision, counted from the records themselves, so
 * approving one anywhere in the app takes it off the count everywhere.
 */
export function pendingApprovals(db: Db): Record<ApprovalKind, number> {
  return {
    material_request: db.materialRequests.filter((request) => request.status === "pending").length,
    timesheet: db.timesheets.length,
    purchase_order: db.purchaseOrders.filter((order) => order.status === "awaiting_approval")
      .length,
    variation_order: db.variationOrders.filter((order) => order.status === "pending").length,
  };
}

export function registerDashboardRoutes(router: Router) {
  router.get("/dashboard/summary", ({ db, now }): DashboardSummary => {
    const today = lagosDay(now);
    const active = db.projects.filter((project) => project.status === "active");

    const open = db.invoices.filter((invoice) => balanceOf(invoice) > 0);
    // ISO dates compare correctly as strings: "2026-10-14" < "2026-10-27".
    const overdue = open.filter((invoice) => dueOn(invoice) < today);

    const attention: AttentionItem[] = [];

    const low = db.stock
      .filter((level) => level.quantity < level.reorderLevel)
      .sort((a, b) => a.quantity / a.reorderLevel - b.quantity / b.reorderLevel);
    const lowest = low[0];
    const lowItem = lowest && db.stockItems.find((entry) => entry.id === lowest.itemId);
    if (lowest && lowItem) {
      attention.push({
        kind: "low_stock",
        id: `low_stock:${lowest.id}`,
        item: { id: lowItem.id, name: lowItem.name, unit: lowItem.unit },
        location: lowest.location,
        quantity: lowest.quantity,
        unit: lowItem.unit,
        reorderLevel: lowest.reorderLevel,
        othersLow: low.length - 1,
      });
    }

    // The one with the most money at stake.
    const worst = [...overdue].sort((a, b) => balanceOf(b) - balanceOf(a))[0];
    if (worst) {
      attention.push({
        kind: "overdue_invoice",
        id: `overdue_invoice:${worst.id}`,
        invoice: { id: worst.id, number: worst.number },
        client: worst.client,
        balance: balanceOf(worst),
        dueDate: dueOn(worst),
      });
    }

    const serviceDue = db.equipment
      .filter((item) => item.nextService && item.nextService.dueOn <= lagosDay(now, 3))
      .sort((a, b) => a.nextService!.dueOn.localeCompare(b.nextService!.dueOn))[0];
    if (serviceDue?.nextService) {
      attention.push({
        kind: "service_due",
        id: `service_due:${serviceDue.id}`,
        equipment: { id: serviceDue.id, code: serviceDue.code, name: serviceDue.name },
        service: serviceDue.nextService.description,
        dueDate: serviceDue.nextService.dueOn,
      });
    }

    const expiring = db.certifications
      .filter((cert) => cert.expiresOn >= today && cert.expiresOn <= lagosDay(now, 21))
      .sort((a, b) => a.expiresOn.localeCompare(b.expiresOn));
    const latest = expiring.at(-1);
    if (latest) {
      attention.push({
        kind: "certifications_expiring",
        id: "certifications_expiring",
        certification: latest.name,
        count: expiring.length,
        latestExpiry: latest.expiresOn,
      });
    }

    const units: Record<UnitStatus, number> = { sold: 0, reserved: 0, leased: 0, available: 0 };
    for (const development of db.developments) {
      for (const status of Object.keys(units) as UnitStatus[]) {
        units[status] += development.units[status];
      }
    }

    return {
      sites: {
        active: active.length,
        behindSchedule: active.filter((project) => project.health !== "on_track").length,
      },
      contracts: {
        inProgress: sum(active.map((project) => project.budget)),
        billed: sum(active.map((project) => project.billed)),
      },
      receivables: {
        outstanding: sum(open.map(balanceOf)),
        overdue: sum(overdue.map(balanceOf)),
        overdueInvoices: overdue.length,
      },
      crew: {
        onSite: sum(active.map((project) => project.crew?.onSite ?? 0)),
        rostered: sum(active.map((project) => project.crew?.rostered ?? 0)),
      },
      attention,
      approvals: pendingApprovals(db),
      sales: { developments: db.developments.length, units },
    };
  });
}
