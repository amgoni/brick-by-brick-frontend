import type {
  Invoice,
  InvoiceEvent,
  InvoicePayment,
  InvoiceStatus,
  InvoiceSummary,
  Page,
  PaymentMethod,
  Ref,
} from "@/lib/api/types";
import { toCsv } from "@/lib/csv";
import { formatMoney } from "@/lib/format";
import {
  balanceOf,
  dueOn,
  invoiceStatus,
  invoiceTotals,
  paymentEvent,
  toInvoice,
  toInvoiceDetail,
} from "../invoicing";
import {
  created,
  enumParam,
  HttpError,
  intParam,
  invalid,
  isAmount,
  isISODate,
  isRecord,
  type Router,
} from "../router";
import type { Db, InvoiceRecord } from "../seed";
import { dayDiff, lagosDay } from "../time";

const STATUSES: InvoiceStatus[] = ["draft", "sent", "part_paid", "overdue", "paid"];
const PAYMENT_METHODS: PaymentMethod[] = ["bank_transfer", "cheque", "cash", "pos"];

/** How far either side of today an invoice can be dated. */
const DATE_WINDOW_DAYS = 30;

const me = (db: Db): Ref => ({ id: db.currentUser.id, name: db.currentUser.name });

const toKobo = (naira: number) => Math.round(naira * 100);

function findInvoice(db: Db, id: string | undefined): InvoiceRecord {
  const invoice = db.invoices.find((entry) => entry.id === id);
  if (!invoice) throw new HttpError(404, "not_found", "There's no invoice with that id.");
  return invoice;
}

function addEvent(
  invoice: InvoiceRecord,
  now: Date,
  event: Pick<InvoiceEvent, "title" | "by" | "detail">,
) {
  invoice.activity.push({
    id: `${invoice.id}_e${invoice.activity.length + 1}`,
    at: now.toISOString(),
    ...event,
  });
}

/** Optional text: absent or blank is null; too long is a 400. */
function optionalText(value: unknown, label: string, max: number): string | null {
  if (value === undefined) return null;
  if (typeof value !== "string") invalid(`${label} must be text.`);
  if (value.trim().length > max) invalid(`Keep ${label.toLowerCase()} to ${max} characters.`);
  return value.trim() || null;
}

/**
 * Reads and checks the body of a draft (POST /invoices, PUT /invoices/:id).
 * The builder checks the same things first, but any program can send a
 * request, so the server checks again and says what's wrong in words the
 * form can show.
 */
function readInvoice(db: Db, body: unknown, today: string) {
  if (!isRecord(body)) invalid("Send the invoice as a JSON object.");

  const client =
    db.clients.find((entry) => entry.id === body.clientId) ?? invalid("Choose who to bill.");

  let project: Ref | null = null;
  if (body.projectId !== undefined) {
    const found =
      db.projects.find((entry) => entry.id === body.projectId) ??
      invalid("Choose a project from the list.");
    project = { id: found.id, name: found.name };
  }

  const reference = optionalText(body.reference, "What it's for", 80);
  if (!reference) invalid("Say what the invoice is for, such as Valuation 4.");

  const sendTo = optionalText(body.sendTo, "Send to", 254) ?? client.email;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sendTo)) invalid("Enter an email address to send it to.");

  if (!isISODate(body.issuedOn)) invalid("Issue date must be a date, like 2026-10-30.");
  if (Math.abs(dayDiff(today, body.issuedOn)) > DATE_WINDOW_DAYS) {
    invalid(`Date it within ${DATE_WINDOW_DAYS} days of today.`);
  }

  if (!db.invoicing.paymentTerms.includes(body.paymentTermsDays as number)) {
    invalid("Choose payment terms from the list.");
  }

  if (!Array.isArray(body.lines) || body.lines.length === 0) invalid("Add at least one line.");
  if (body.lines.length > 50) invalid("An invoice can have up to 50 lines.");
  const lines = body.lines.map((raw: unknown, index: number) => {
    const entry = isRecord(raw) ? raw : {};
    const row = `line ${index + 1}`;
    const description = optionalText(entry.description, "Descriptions", 200);
    if (!description) invalid(`Describe ${row}.`);
    if (!isAmount(entry.quantity) || entry.quantity <= 0) {
      invalid(`Enter a quantity above 0 on ${row}.`);
    }
    const unit = optionalText(entry.unit, "Units", 12);
    if (!unit) invalid(`Enter a unit on ${row}, such as item or t.`);
    if (!isAmount(entry.rate) || entry.rate < 0) invalid(`Enter a rate on ${row}.`);
    return { description, quantity: entry.quantity, unit, rate: entry.rate };
  });

  if (typeof body.chargeVat !== "boolean") invalid("Say whether to charge VAT.");
  if (!db.invoicing.retentionRates.includes(body.retentionRate as number)) {
    invalid("Choose a retention rate from the list.");
  }

  return {
    client: { id: client.id, name: client.name },
    project,
    reference,
    sendTo,
    clientReference: optionalText(body.clientReference, "The client's reference", 40),
    issuedOn: body.issuedOn,
    paymentTermsDays: body.paymentTermsDays as number,
    lines,
    chargeVat: body.chargeVat,
    retentionRate: body.retentionRate as number,
    notes: optionalText(body.notes, "Notes", 1000),
  };
}

/** Lines are saved whole with the draft, so each save numbers them afresh. */
const numberLines = (id: string, lines: ReturnType<typeof readInvoice>["lines"]) =>
  lines.map((line, index) => ({ id: `${id}_${index + 1}`, ...line }));

function requireDraft(invoice: InvoiceRecord) {
  if (invoice.state !== "draft") {
    throw new HttpError(
      409,
      "already_sent",
      `${invoice.number} has been sent, so it can't be changed.`,
    );
  }
}

/** Chasing and paying only make sense for an invoice that's out and still owed. */
function requireOwed(invoice: InvoiceRecord, today: string) {
  if (invoice.state === "draft") {
    throw new HttpError(409, "not_sent", `${invoice.number} hasn't been sent yet.`);
  }
  if (invoiceStatus(invoice, today) === "paid") {
    throw new HttpError(409, "already_paid", `${invoice.number} has been paid in full.`);
  }
}

/** Invoices with a status, newest number first: the order every list and export uses. */
function listed(db: Db, today: string, status: InvoiceStatus | undefined): InvoiceRecord[] {
  return db.invoices
    .filter((invoice) => !status || invoiceStatus(invoice, today) === status)
    .sort((a, b) => b.number.localeCompare(a.number));
}

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  part_paid: "Part paid",
  overdue: "Overdue",
  paid: "Paid",
};

export function registerInvoiceRoutes(router: Router) {
  /*
   * The first list that pages: a company raises a hundred and fifty invoices a
   * year, and they never stop coming. `cursor` is the `nextCursor` of the page
   * before; leave it out for the first page.
   */
  router.get("/invoices", ({ db, query, now }): Page<Invoice> => {
    const today = lagosDay(now);
    const status = enumParam(query, "status", STATUSES);
    const limit = intParam(query, "limit", { fallback: 10, min: 1, max: 100 });
    const cursor = query.get("cursor");
    if (cursor && !/^INV-\d{4}-\d{4,}$/.test(cursor)) {
      invalid("That cursor isn't one this server gave out. Start again without it.");
    }

    const all = listed(db, today, status);
    // The cursor is the number of the last invoice sent; the next page starts after it.
    const start = cursor ? all.findIndex((invoice) => invoice.number < cursor) : 0;
    const items = start === -1 ? [] : all.slice(start, start + limit);
    const last = items.at(-1);
    const more = last !== undefined && all.indexOf(last) < all.length - 1;
    return {
      items: items.map((invoice) => toInvoice(invoice, today)),
      total: all.length,
      nextCursor: more ? last.number : null,
    };
  });

  // Registered before /invoices/:id, which would otherwise take "summary" for an id.
  router.get("/invoices/summary", ({ db, now }): InvoiceSummary => {
    const today = lagosDay(now);
    const withStatus = db.invoices.map((invoice) => ({
      invoice,
      status: invoiceStatus(invoice, today),
    }));
    const sum = (values: number[]) =>
      values.reduce((total, value) => total + toKobo(value), 0) / 100;

    const owed = withStatus.filter(({ invoice }) => balanceOf(invoice) > 0);
    const overdue = owed.filter(({ status }) => status === "overdue");
    const drafts = withStatus.filter(({ status }) => status === "draft");
    const month = db.cashFlow.at(-1);

    const counts = Object.fromEntries(STATUSES.map((status) => [status, 0])) as Record<
      InvoiceStatus,
      number
    >;
    for (const { status } of withStatus) counts[status] += 1;

    return {
      outstanding: {
        amount: sum(owed.map(({ invoice }) => balanceOf(invoice))),
        count: owed.length,
      },
      overdue: {
        amount: sum(overdue.map(({ invoice }) => balanceOf(invoice))),
        count: overdue.length,
        oldestDueDate: overdue.map(({ invoice }) => dueOn(invoice)).sort()[0] ?? null,
      },
      collected: {
        month: month?.month ?? today.slice(0, 7),
        amount: month?.collected ?? 0,
        invoiced: month?.invoiced ?? 0,
      },
      drafts: {
        amount: sum(drafts.map(({ invoice }) => invoiceTotals(invoice).total)),
        count: drafts.length,
      },
      counts,
    };
  });

  /*
   * Every invoice that matches, as a spreadsheet. The server builds it, since
   * the browser only ever holds the pages it has loaded. Raw values, as in
   * every export: naira and ISO dates, so a spreadsheet can sum and sort them.
   */
  router.get("/invoices/export.csv", ({ db, query, now }) => {
    const today = lagosDay(now);
    const status = enumParam(query, "status", STATUSES);
    const rows = listed(db, today, status).map((invoice) => toInvoice(invoice, today));
    const csv = toCsv(rows, [
      { header: "Invoice", value: (row) => row.number },
      { header: "Client", value: (row) => row.client.name },
      { header: "Project", value: (row) => row.project?.name },
      { header: "For", value: (row) => row.reference },
      { header: "Issued", value: (row) => (row.status === "draft" ? null : row.issuedOn) },
      { header: "Due", value: (row) => (row.status === "draft" ? null : row.dueOn) },
      { header: "Total (NGN)", value: (row) => row.total },
      { header: "Paid (NGN)", value: (row) => row.paid },
      { header: "Balance (NGN)", value: (row) => row.balance },
      { header: "Status", value: (row) => STATUS_LABELS[row.status] },
    ]);
    const name = `invoices-${status ? `${status.replace("_", "-")}-` : ""}${today}.csv`;
    // A byte-order mark first, or Excel reads the file as ANSI and ₦ turns to "â‚¦".
    return new Response(`﻿${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "no-store",
      },
    });
  });

  router.get("/invoices/:id", ({ db, params, now }) =>
    toInvoiceDetail(findInvoice(db, params.id), lagosDay(now)),
  );

  /*
   * A new draft. It's numbered now, so it can be talked about and found
   * before it's sent; the server works out the totals whenever it's read.
   */
  router.post("/invoices", ({ db, body, now }) => {
    const today = lagosDay(now);
    const fields = readInvoice(db, body, today);
    db.sequences.invoice += 1;
    const number = String(db.sequences.invoice).padStart(4, "0");

    const id = `inv_${number}`;
    const invoice: InvoiceRecord = {
      id,
      number: `INV-${today.slice(0, 4)}-${number}`,
      state: "draft",
      ...fields,
      lines: numberLines(id, fields.lines),
      vatRate: db.invoicing.vatRate,
      payments: [],
      activity: [],
      createdBy: me(db),
    };
    addEvent(invoice, now, { title: "Draft created", by: me(db), detail: null });
    db.invoices.push(invoice);
    return created(toInvoiceDetail(invoice, today), `/invoices/${invoice.id}`);
  });

  // A draft is saved whole, every time: the body is the invoice as it should now be.
  router.put("/invoices/:id", ({ db, params, body, now }) => {
    const today = lagosDay(now);
    const invoice = findInvoice(db, params.id);
    requireDraft(invoice);
    const fields = readInvoice(db, body, today);
    // Until it's sent, a draft takes the company's current VAT rate.
    Object.assign(invoice, {
      ...fields,
      lines: numberLines(invoice.id, fields.lines),
      vatRate: db.invoicing.vatRate,
    });
    return toInvoiceDetail(invoice, today);
  });

  /*
   * Sending is one-way: from here the invoice can't be edited, only paid,
   * chased or (later) credited. Its total counts as invoiced in the month
   * it's dated.
   */
  router.post("/invoices/:id/send", ({ db, params, now }) => {
    const today = lagosDay(now);
    const invoice = findInvoice(db, params.id);
    requireDraft(invoice);
    const { total } = invoiceTotals(invoice);
    if (total <= 0) invalid("There's nothing to bill: the total is ₦0.");

    invoice.state = "issued";
    addEvent(invoice, now, { title: `Sent to ${invoice.sendTo}`, by: me(db), detail: null });
    const month = db.cashFlow.find((entry) => entry.month === invoice.issuedOn.slice(0, 7));
    if (month) month.invoiced += total;
    return toInvoiceDetail(invoice, today);
  });

  router.post("/invoices/:id/remind", ({ db, params, now }) => {
    const today = lagosDay(now);
    const invoice = findInvoice(db, params.id);
    requireOwed(invoice, today);
    addEvent(invoice, now, {
      title: `Reminder sent to ${invoice.sendTo}`,
      by: me(db),
      detail: null,
    });
    return toInvoiceDetail(invoice, today);
  });

  /*
   * Money in. It can't be more than what's owed (an overpayment is a credit,
   * which is its own job), or dated before the invoice or after today. It
   * counts as collected in the month it arrived.
   */
  router.post("/invoices/:id/payments", ({ db, params, body, now }) => {
    const today = lagosDay(now);
    const invoice = findInvoice(db, params.id);
    requireOwed(invoice, today);
    if (!isRecord(body)) invalid("Send the payment as a JSON object.");

    const balance = balanceOf(invoice);
    const { amount, receivedOn, method } = body;
    if (!isAmount(amount) || amount <= 0) invalid("Enter the amount received.");
    if (Math.abs(amount * 100 - toKobo(amount)) > 1e-6) {
      invalid("Amounts go to the kobo at most: two decimal places.");
    }
    if (toKobo(amount) > toKobo(balance)) {
      invalid(`That's more than the balance of ${formatMoney(balance, { kobo: true })}.`);
    }
    if (!isISODate(receivedOn)) invalid("Date received must be a date, like 2026-10-30.");
    if (receivedOn > today) invalid("Date received can't be in the future.");
    if (receivedOn < invoice.issuedOn) invalid("Date received can't be before the invoice date.");
    if (!PAYMENT_METHODS.includes(method as PaymentMethod)) invalid("Choose how it was paid.");

    const payment: InvoicePayment = {
      id: `pay_${invoice.number.slice(-4)}_${invoice.payments.length + 1}`,
      amount: toKobo(amount) / 100,
      receivedOn,
      method: method as PaymentMethod,
      reference: optionalText(body.reference, "The payment reference", 40),
      recordedBy: me(db),
    };
    invoice.payments.push(payment);
    addEvent(invoice, now, paymentEvent(payment, balanceOf(invoice) <= 0));
    const month = db.cashFlow.find((entry) => entry.month === receivedOn.slice(0, 7));
    if (month) month.collected += payment.amount;

    return created(
      toInvoiceDetail(invoice, today),
      `/invoices/${invoice.id}/payments/${payment.id}`,
    );
  });

  router.get("/invoices/:id/payments/:paymentId", ({ db, params }) => {
    const payment = findInvoice(db, params.id).payments.find(
      (entry) => entry.id === params.paymentId,
    );
    if (!payment) throw new HttpError(404, "not_found", "There's no payment with that id.");
    return payment;
  });

  router.get("/invoicing/settings", ({ db }) => db.invoicing);
}
