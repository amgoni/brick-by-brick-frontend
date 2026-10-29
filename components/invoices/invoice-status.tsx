import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { Invoice, InvoiceStatus, PaymentMethod } from "@/lib/api/types";
import { daysBetween, formatCount, formatMoney, formatPercent } from "@/lib/format";

/** How each status reads, and the tone it carries. */
export const INVOICE_STATUS: Record<InvoiceStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Draft", tone: "neutral" },
  sent: { label: "Sent", tone: "info" },
  part_paid: { label: "Part paid", tone: "warning" },
  overdue: { label: "Overdue", tone: "danger" },
  paid: { label: "Paid", tone: "success" },
};

/** The status filter, in the order a bill goes through them. */
export const STATUS_ORDER: InvoiceStatus[] = ["draft", "sent", "part_paid", "overdue", "paid"];

export const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  bank_transfer: "Bank transfer",
  cheque: "Cheque",
  cash: "Cash",
  pos: "POS",
};

/** "Net 30" */
export const formatTerms = (days: number) => `Net ${days}`;

/** 0.075 → "7.5%", 0.05 → "5%" */
export const formatRate = (rate: number) => formatPercent(rate, { decimals: 1 });

/** Naira, with kobo only when there are some: the list's ₦65,036,250 and ₦13,775,609.76. */
export const formatAmount = (amount: number) =>
  formatMoney(amount, { kobo: !Number.isInteger(amount) });

/** "Overdue 12 days" for an overdue invoice; otherwise its status. Reads the clock. */
export function statusLabel(invoice: Pick<Invoice, "status" | "dueOn">, now: Date): string {
  if (invoice.status !== "overdue") return INVOICE_STATUS[invoice.status].label;
  const days = daysBetween(invoice.dueOn, now);
  return `Overdue ${formatCount(days, "day")}`;
}

/** The status as a badge. Render it in the browser: "Overdue 12 days" depends on today. */
export function InvoiceStatusBadge({ invoice }: { invoice: Pick<Invoice, "status" | "dueOn"> }) {
  return (
    <Badge tone={INVOICE_STATUS[invoice.status].tone}>{statusLabel(invoice, new Date())}</Badge>
  );
}
