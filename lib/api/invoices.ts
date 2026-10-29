import { API_BASE, apiFetch, type ApiRequest } from "@/lib/api/client";
import type {
  Invoice,
  InvoiceDetail,
  InvoiceInput,
  InvoiceStatus,
  InvoiceSummary,
  InvoicingSettings,
  Page,
  PaymentInput,
} from "@/lib/api/types";

type Options = Pick<ApiRequest, "signal">;

export interface ListInvoicesParams {
  status?: InvoiceStatus;
  /** The `nextCursor` of the page before; leave it out for the first page. */
  cursor?: string;
  limit?: number;
}

/** GET /invoices?status=&cursor=&limit= : one page, newest first. */
export function listInvoices(params: ListInvoicesParams = {}, options?: Options) {
  return apiFetch<Page<Invoice>>("/invoices", { ...options, query: { ...params } });
}

/** GET /invoices/summary: the figures over the list, across every invoice. */
export function getInvoiceSummary(options?: Options) {
  return apiFetch<InvoiceSummary>("/invoices/summary", options);
}

/**
 * GET /invoices/export.csv?status= : every matching invoice as a CSV
 * attachment. A link, not a fetch: the browser downloads it.
 */
export function invoiceExportUrl(status?: InvoiceStatus) {
  return `${API_BASE}/invoices/export.csv${status ? `?status=${status}` : ""}`;
}

/** GET /invoices/:id */
export function getInvoice(id: string, options?: Options) {
  return apiFetch<InvoiceDetail>(`/invoices/${encodeURIComponent(id)}`, options);
}

/** POST /invoices → 201 with the new draft, numbered by the server. 400 if it won't accept it. */
export function createInvoice(input: InvoiceInput) {
  return apiFetch<InvoiceDetail>("/invoices", { method: "POST", body: input });
}

/** PUT /invoices/:id → the draft as saved. 409 once it's been sent. */
export function updateInvoice(id: string, input: InvoiceInput) {
  return apiFetch<InvoiceDetail>(`/invoices/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: input,
  });
}

/** POST /invoices/:id/send → the invoice, sent. 409 if it already was. */
export function sendInvoice(id: string) {
  return apiFetch<InvoiceDetail>(`/invoices/${encodeURIComponent(id)}/send`, { method: "POST" });
}

/** POST /invoices/:id/remind → the invoice, with the reminder in its activity. */
export function remindInvoice(id: string) {
  return apiFetch<InvoiceDetail>(`/invoices/${encodeURIComponent(id)}/remind`, {
    method: "POST",
  });
}

/** POST /invoices/:id/payments → 201 with the invoice as it now stands. */
export function recordPayment(id: string, input: PaymentInput) {
  return apiFetch<InvoiceDetail>(`/invoices/${encodeURIComponent(id)}/payments`, {
    method: "POST",
    body: input,
  });
}

/** GET /invoicing/settings */
export function getInvoicingSettings(options?: Options) {
  return apiFetch<InvoicingSettings>("/invoicing/settings", options);
}
