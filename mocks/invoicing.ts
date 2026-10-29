import type {
  Invoice,
  InvoiceDetail,
  InvoiceEvent,
  InvoicePayment,
  InvoiceStatus,
  ISODate,
  PaymentMethod,
} from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import type { InvoiceRecord } from "./seed";
import { shiftDay } from "./time";

/*
 * Everything about an invoice that's worked out rather than stored: its
 * totals, what's been paid, when it's due and what state it's in. Routes read
 * invoices through these, so a figure can never disagree with the lines and
 * payments it comes from.
 */

const toKobo = (naira: number) => Math.round(naira * 100);

type Billing = Pick<InvoiceRecord, "lines" | "chargeVat" | "vatRate" | "retentionRate">;

/**
 * The lines' amounts, the subtotal, VAT on it (if charged), the retention the
 * client holds back, and the total due. Each line is rounded to the kobo, and
 * the rest is worked in whole kobo from there, so the parts always add up to
 * the total exactly.
 */
export function invoiceTotals(invoice: Billing) {
  const amounts = invoice.lines.map((line) => toKobo(line.quantity * line.rate));
  const subtotal = amounts.reduce((total, amount) => total + amount, 0);
  const vat = invoice.chargeVat ? Math.round(subtotal * invoice.vatRate) : 0;
  const retention = Math.round(subtotal * invoice.retentionRate);
  return {
    lines: invoice.lines.map((line, index) => ({ ...line, amount: (amounts[index] ?? 0) / 100 })),
    subtotal: subtotal / 100,
    vat: vat / 100,
    retention: retention / 100,
    total: (subtotal + vat - retention) / 100,
  };
}

/** What's been received against it, to the kobo. */
export function paidOn(invoice: InvoiceRecord): number {
  return invoice.payments.reduce((total, payment) => total + toKobo(payment.amount), 0) / 100;
}

/** What the client still owes. A draft owes nothing: it hasn't been sent. */
export function balanceOf(invoice: InvoiceRecord): number {
  if (invoice.state === "draft") return 0;
  return (toKobo(invoiceTotals(invoice).total) - toKobo(paidOn(invoice))) / 100;
}

export function dueOn(invoice: Pick<InvoiceRecord, "issuedOn" | "paymentTermsDays">): ISODate {
  return shiftDay(invoice.issuedOn, invoice.paymentTermsDays);
}

/** Overdue beats part paid: a late invoice is late however much of it has come in. */
export function invoiceStatus(invoice: InvoiceRecord, today: ISODate): InvoiceStatus {
  if (invoice.state === "draft") return "draft";
  if (balanceOf(invoice) <= 0) return "paid";
  // ISO dates compare correctly as strings: "2026-10-14" < "2026-10-27".
  if (dueOn(invoice) < today) return "overdue";
  return invoice.payments.length > 0 ? "part_paid" : "sent";
}

const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  bank_transfer: "Bank transfer",
  cheque: "Cheque",
  cash: "Cash",
  pos: "POS",
};

/** The activity entry for a payment: "Payment received · ₦33,500,000", "Bank transfer, ref ACP-2210". */
export function paymentEvent(
  payment: InvoicePayment,
  paidInFull: boolean,
): Pick<InvoiceEvent, "title" | "by" | "detail"> {
  const amount = formatMoney(payment.amount, { kobo: !Number.isInteger(payment.amount) });
  return {
    title: `${paidInFull ? "Paid in full" : "Payment received"} · ${amount}`,
    by: payment.recordedBy,
    detail: [PAYMENT_METHODS[payment.method], payment.reference && `ref ${payment.reference}`]
      .filter(Boolean)
      .join(", "),
  };
}

export function toInvoice(invoice: InvoiceRecord, today: ISODate): Invoice {
  return {
    id: invoice.id,
    number: invoice.number,
    client: invoice.client,
    project: invoice.project,
    reference: invoice.reference,
    issuedOn: invoice.issuedOn,
    dueOn: dueOn(invoice),
    total: invoiceTotals(invoice).total,
    paid: paidOn(invoice),
    balance: balanceOf(invoice),
    status: invoiceStatus(invoice, today),
  };
}

export function toInvoiceDetail(invoice: InvoiceRecord, today: ISODate): InvoiceDetail {
  const { lines, subtotal, vat, retention } = invoiceTotals(invoice);
  return {
    ...toInvoice(invoice, today),
    sendTo: invoice.sendTo,
    clientReference: invoice.clientReference,
    paymentTermsDays: invoice.paymentTermsDays,
    lines,
    subtotal,
    chargeVat: invoice.chargeVat,
    vatRate: invoice.vatRate,
    vat,
    retentionRate: invoice.retentionRate,
    retention,
    notes: invoice.notes,
    payments: invoice.payments,
    activity: [...invoice.activity].reverse(),
    createdBy: invoice.createdBy,
  };
}
