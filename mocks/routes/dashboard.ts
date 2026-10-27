import type { ApprovalKind, AttentionItem, DashboardSummary, UnitStatus } from "@/lib/api/types";
import type { Router } from "../router";
import type { InvoiceRecord } from "../seed";
import { lagosDay } from "../time";

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/** What the client still owes. Drafts and void invoices owe nothing. */
export const balanceOf = (invoice: InvoiceRecord) =>
  invoice.status === "issued" ? invoice.amount - invoice.paid : 0;

export function registerDashboardRoutes(router: Router) {
  router.get("/dashboard/summary", ({ db, now }): DashboardSummary => {
    const today = lagosDay(now);
    const active = db.projects.filter((project) => project.status === "active");

    const open = db.invoices.filter((invoice) => balanceOf(invoice) > 0);
    // ISO dates compare correctly as strings: "2026-10-14" < "2026-10-27".
    const overdue = open.filter((invoice) => invoice.dueOn !== null && invoice.dueOn < today);

    const attention: AttentionItem[] = [];

    const low = db.stock
      .filter((item) => item.quantity < item.reorderLevel)
      .sort((a, b) => a.quantity / a.reorderLevel - b.quantity / b.reorderLevel);
    const lowest = low[0];
    if (lowest) {
      attention.push({
        kind: "low_stock",
        id: `low_stock:${lowest.id}`,
        item: { id: lowest.id, name: lowest.name },
        location: lowest.location,
        quantity: lowest.quantity,
        unit: lowest.unit,
        reorderLevel: lowest.reorderLevel,
        othersLow: low.length - 1,
      });
    }

    // The one with the most money at stake.
    const worst = [...overdue].sort((a, b) => balanceOf(b) - balanceOf(a))[0];
    if (worst?.dueOn) {
      attention.push({
        kind: "overdue_invoice",
        id: `overdue_invoice:${worst.id}`,
        invoice: { id: worst.id, number: worst.number },
        client: worst.client,
        balance: balanceOf(worst),
        dueDate: worst.dueOn,
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

    const approvals: Record<ApprovalKind, number> = {
      material_request: 0,
      timesheet: 0,
      purchase_order: 0,
      variation_order: 0,
    };
    for (const approval of db.approvals) approvals[approval.kind] += 1;

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
      approvals,
      sales: { developments: db.developments.length, units },
    };
  });
}
