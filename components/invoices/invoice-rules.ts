import type {
  Client,
  InvoiceDetail,
  InvoiceInput,
  InvoicingSettings,
  PaymentInput,
  PaymentMethod,
  Project,
} from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import { parseNumber } from "@/lib/utils";

/*
 * The invoice builder's and the payment dialog's rules, as plain functions:
 * what a draft holds, what's wrong with it, the request body it becomes, and
 * the totals it comes to. The server checks all of it again (it has to), and
 * works the totals out the same way, to the kobo.
 */

export const LIMITS = {
  reference: 80,
  sendTo: 254,
  clientReference: 40,
  description: 200,
  unit: 12,
  notes: 1000,
  lines: 50,
  paymentReference: 40,
} as const;

/** How far either side of today an invoice can be dated, as the server allows. */
export const DATE_WINDOW_DAYS = 30;

/** "2026-10-28" plus `days`: calendar arithmetic on the date alone, so no time zone can shift it. */
export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// The builder
// ---------------------------------------------------------------------------

export interface LineDraft {
  /** A stable key for React while lines are added and removed; not sent. */
  key: string;
  description: string;
  quantity: string;
  unit: string;
  rate: string;
}

/** What the builder holds while it's filled in: text, exactly as typed or picked. */
export interface InvoiceDraft {
  clientId: string;
  /** "" for no project. */
  projectId: string;
  reference: string;
  sendTo: string;
  clientReference: string;
  issuedOn: string;
  paymentTermsDays: string;
  lines: LineDraft[];
  chargeVat: boolean;
  retentionRate: string;
  notes: string;
}

export type LineField = "description" | "quantity" | "unit" | "rate";
export type LineErrors = Partial<Record<LineField, string>>;

export type InvoiceErrors = Partial<
  Record<Exclude<keyof InvoiceDraft, "lines" | "chargeVat">, string>
> & {
  /** By line key. */
  lines?: Record<string, LineErrors>;
};

let lineCount = 0;

export function newLine(fields: Partial<Omit<LineDraft, "key">> = {}): LineDraft {
  lineCount += 1;
  return {
    key: `line-${lineCount}`,
    description: "",
    quantity: "1",
    unit: "item",
    rate: "",
    ...fields,
  };
}

export function emptyDraft(settings: InvoicingSettings, today: string): InvoiceDraft {
  return {
    clientId: "",
    projectId: "",
    reference: "",
    sendTo: "",
    clientReference: "",
    issuedOn: today,
    paymentTermsDays: String(settings.defaultPaymentTermsDays),
    lines: [newLine()],
    chargeVat: true,
    retentionRate: "0",
    notes: "",
  };
}

export function draftFromInvoice(invoice: InvoiceDetail): InvoiceDraft {
  return {
    clientId: invoice.client.id,
    projectId: invoice.project?.id ?? "",
    reference: invoice.reference,
    sendTo: invoice.sendTo,
    clientReference: invoice.clientReference ?? "",
    issuedOn: invoice.issuedOn,
    paymentTermsDays: String(invoice.paymentTermsDays),
    lines: invoice.lines.map((line) =>
      newLine({
        description: line.description,
        quantity: String(line.quantity),
        unit: line.unit,
        rate: String(line.rate),
      }),
    ),
    chargeVat: invoice.chargeVat,
    retentionRate: String(invoice.retentionRate),
    notes: invoice.notes ?? "",
  };
}

/** Whether two drafts would save the same invoice: line keys don't count. */
export function sameDraft(a: InvoiceDraft, b: InvoiceDraft): boolean {
  const strip = (draft: InvoiceDraft) => ({
    ...draft,
    lines: draft.lines.map((line) => [line.description, line.quantity, line.unit, line.rate]),
  });
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b));
}

/**
 * The projects an invoice to this client can be for: the contracts the
 * company builds for it, or, for a buyer, the company's own developments,
 * where the homes are sold.
 */
export function projectsFor(client: Client | undefined, projects: Project[]): Project[] {
  if (!client) return [];
  return projects.filter((project) =>
    client.kind === "buyer" ? project.client === null : project.client?.id === client.id,
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Checks a draft before it's saved or sent, one message per field (and per
 * line), in words that say what to do. The controls stop most of these
 * already; this catches what a paste or a stale form gets past them.
 */
export function validateInvoice(draft: InvoiceDraft, { today }: { today: string }): InvoiceErrors {
  const errors: InvoiceErrors = {};

  if (!draft.clientId) errors.clientId = "Choose who to bill.";
  if (!draft.reference.trim()) errors.reference = "Say what it's for, such as Valuation 4.";

  const sendTo = draft.sendTo.trim();
  if (!sendTo) errors.sendTo = "Enter the email address it goes to.";
  else if (!EMAIL.test(sendTo)) errors.sendTo = "Enter an email address, like accounts@client.com.";

  if (!draft.issuedOn) errors.issuedOn = "Choose the date it's issued.";
  else if (
    draft.issuedOn < addDays(today, -DATE_WINDOW_DAYS) ||
    draft.issuedOn > addDays(today, DATE_WINDOW_DAYS)
  ) {
    errors.issuedOn = `Date it within ${DATE_WINDOW_DAYS} days of today.`;
  }

  const lines: Record<string, LineErrors> = {};
  for (const line of draft.lines) {
    const found: LineErrors = {};
    if (!line.description.trim()) found.description = "Describe the line.";
    const quantity = parseNumber(line.quantity);
    if (quantity === null || quantity <= 0) found.quantity = "Enter a quantity above 0.";
    if (!line.unit.trim()) found.unit = "Enter a unit, such as item or t.";
    if (parseNumber(line.rate) === null) found.rate = "Enter a rate.";
    if (Object.keys(found).length > 0) lines[line.key] = found;
  }
  if (Object.keys(lines).length > 0) errors.lines = lines;

  return errors;
}

/** Whether there's anything to fix. */
export const hasErrors = (errors: InvoiceErrors) =>
  Object.values(errors).some((value) => value !== undefined);

/**
 * The request body for a draft that passed `validateInvoice`. Optional fields
 * left blank are left out rather than sent as "".
 */
export function toInvoiceInput(draft: InvoiceDraft): InvoiceInput {
  const optional = (value: string) => value.trim() || undefined;
  return {
    clientId: draft.clientId,
    ...(draft.projectId && { projectId: draft.projectId }),
    reference: draft.reference.trim(),
    ...(optional(draft.sendTo) && { sendTo: draft.sendTo.trim() }),
    ...(optional(draft.clientReference) && { clientReference: draft.clientReference.trim() }),
    issuedOn: draft.issuedOn,
    paymentTermsDays: Number(draft.paymentTermsDays),
    lines: draft.lines.map((line) => ({
      description: line.description.trim(),
      quantity: parseNumber(line.quantity) ?? 0,
      unit: line.unit.trim(),
      rate: parseNumber(line.rate) ?? 0,
    })),
    chargeVat: draft.chargeVat,
    retentionRate: Number(draft.retentionRate),
    ...(optional(draft.notes) && { notes: draft.notes.trim() }),
  };
}

const toKobo = (naira: number) => Math.round(naira * 100);

/**
 * Each line's amount and the invoice's totals as the draft stands, worked the
 * way the server works them: each line to the kobo, the rest in whole kobo
 * from there. A line with nothing (or nothing valid) in it counts as ₦0.
 */
export function previewTotals(
  draft: Pick<InvoiceDraft, "lines" | "chargeVat" | "retentionRate">,
  vatRate: number,
) {
  const amounts = draft.lines.map((line) =>
    toKobo((parseNumber(line.quantity) ?? 0) * (parseNumber(line.rate) ?? 0)),
  );
  const subtotal = amounts.reduce((total, amount) => total + amount, 0);
  const vat = draft.chargeVat ? Math.round(subtotal * vatRate) : 0;
  const retention = Math.round(subtotal * Number(draft.retentionRate));
  return {
    amounts: amounts.map((amount) => amount / 100),
    subtotal: subtotal / 100,
    vat: vat / 100,
    retention: retention / 100,
    total: (subtotal + vat - retention) / 100,
  };
}

// ---------------------------------------------------------------------------
// Recording a payment
// ---------------------------------------------------------------------------

export interface PaymentDraft {
  amount: string;
  receivedOn: string;
  method: PaymentMethod | "";
  reference: string;
}

export type PaymentErrors = Partial<Record<keyof PaymentDraft, string>>;

export function validatePayment(
  draft: PaymentDraft,
  { balance, issuedOn, today }: { balance: number; issuedOn: string; today: string },
): PaymentErrors {
  const errors: PaymentErrors = {};

  const amount = parseNumber(draft.amount);
  if (amount === null || amount <= 0) errors.amount = "Enter the amount received.";
  else if (toKobo(amount) > toKobo(balance)) {
    errors.amount = `That's more than the ${formatMoney(balance, { kobo: !Number.isInteger(balance) })} still owed.`;
  }

  if (!draft.receivedOn) errors.receivedOn = "Choose the day it arrived.";
  else if (draft.receivedOn > today) errors.receivedOn = "It can't have arrived in the future.";
  else if (draft.receivedOn < issuedOn) errors.receivedOn = "That's before the invoice was issued.";

  if (!draft.method) errors.method = "Choose how it was paid.";

  return errors;
}

export function toPaymentInput(draft: PaymentDraft): PaymentInput {
  const reference = draft.reference.trim();
  return {
    amount: parseNumber(draft.amount) ?? 0,
    receivedOn: draft.receivedOn,
    method: draft.method as PaymentMethod,
    ...(reference && { reference }),
  };
}
