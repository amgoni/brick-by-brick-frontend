"use client";

import { useSearchParams } from "next/navigation";
import { STATUS_ORDER } from "@/components/invoices/invoice-status";
import type { InvoiceStatus } from "@/lib/api/types";

/**
 * The invoice list keeps its state in the URL, `/invoices?status=overdue&invoice=inv_0131`,
 * so a filter or an open invoice can be linked to: the dashboard's "Chase"
 * opens the overdue invoice it's about.
 *
 * Changes go through the native History API, which Next keeps
 * `useSearchParams` in step with, without a navigation. `replaceState`, not
 * `pushState`: opening and closing invoices shouldn't fill the back button.
 *
 * `useSearchParams` suspends while a page is prerendered, so only call this
 * inside a QueryBoundary or BrowserOnly.
 */
export function useInvoiceParams() {
  const searchParams = useSearchParams();
  const rawStatus = searchParams.get("status");
  const status = STATUS_ORDER.find((entry) => entry === rawStatus);
  const invoiceId = searchParams.get("invoice");

  const withChanges = (changes: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    return query ? `/invoices?${query}` : "/invoices";
  };
  const replace = (changes: Record<string, string | undefined>) =>
    window.history.replaceState(null, "", withChanges(changes));

  return {
    status,
    invoiceId,
    setStatus: (next: InvoiceStatus | undefined) => replace({ status: next }),
    openInvoice: (id: string) => replace({ invoice: id }),
    closeInvoice: () => replace({ invoice: undefined }),
    /** The URL that opens an invoice over this list, for links that work in a new tab too. */
    invoiceHref: (id: string) => withChanges({ invoice: id }),
  };
}
