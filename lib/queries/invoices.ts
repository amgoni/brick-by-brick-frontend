import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import {
  createInvoice,
  getInvoice,
  getInvoiceSummary,
  getInvoicingSettings,
  listInvoices,
  recordPayment,
  remindInvoice,
  sendInvoice,
  updateInvoice,
} from "@/lib/api/invoices";
import type {
  Invoice,
  InvoiceDetail,
  InvoiceInput,
  InvoiceStatus,
  Page,
  PaymentInput,
} from "@/lib/api/types";
import { dashboardQueries } from "@/lib/queries/dashboard";
import { reportQueries } from "@/lib/queries/reports";

export interface InvoiceListFilter {
  status?: InvoiceStatus;
}

export const invoiceQueries = {
  all: () => ["invoices"] as const,
  lists: () => [...invoiceQueries.all(), "list"] as const,
  /**
   * The list, a page at a time: each page brings the cursor for the next. The
   * pages loaded so far are cached together, so coming back to the list shows
   * everything that was on screen.
   */
  list: (filter: InvoiceListFilter = {}) =>
    infiniteQueryOptions({
      queryKey: [...invoiceQueries.lists(), filter],
      queryFn: ({ pageParam, signal }) =>
        listInvoices({ ...filter, cursor: pageParam ?? undefined }, { signal }),
      initialPageParam: null as string | null,
      getNextPageParam: (page) => page.nextCursor,
    }),
  summary: () =>
    queryOptions({
      queryKey: [...invoiceQueries.all(), "summary"],
      queryFn: ({ signal }) => getInvoiceSummary({ signal }),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [...invoiceQueries.all(), "detail", id],
      queryFn: ({ signal }) => getInvoice(id, { signal }),
    }),
  settings: () =>
    queryOptions({
      queryKey: [...invoiceQueries.all(), "settings"],
      queryFn: ({ signal }) => getInvoicingSettings({ signal }),
      staleTime: 5 * 60_000,
    }),
};

export const useInvoices = (filter?: InvoiceListFilter) =>
  useSuspenseInfiniteQuery(invoiceQueries.list(filter));

export const useInvoiceSummary = () => useSuspenseQuery(invoiceQueries.summary());

export const useInvoice = (id: string) => useSuspenseQuery(invoiceQueries.detail(id));

export const useInvoicingSettings = () => useSuspenseQuery(invoiceQueries.settings());

/** The fields of a full invoice that a list row shows. */
function toRow(invoice: InvoiceDetail): Invoice {
  const { id, number, client, project, reference, issuedOn, dueOn, total, paid, balance, status } =
    invoice;
  return { id, number, client, project, reference, issuedOn, dueOn, total, paid, balance, status };
}

/**
 * After a write: the server's copy of the invoice goes straight into the
 * cache, and its row in any loaded list changes in place. Then everything the
 * change could move refetches in the background: the lists (a payment can
 * change a status, and so which filter it's under), the summary, and the
 * dashboard's receivables and cash flow. The mutation doesn't wait for those,
 * so a dialog can close as soon as the server has said yes.
 */
function settle(queryClient: QueryClient, invoice: InvoiceDetail, { figures = true } = {}) {
  queryClient.setQueryData(invoiceQueries.detail(invoice.id).queryKey, invoice);
  queryClient.setQueriesData<InfiniteData<Page<Invoice>>>(
    { queryKey: invoiceQueries.lists() },
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          items: page.items.map((item) => (item.id === invoice.id ? toRow(invoice) : item)),
        })),
      },
  );
  if (!figures) return;
  void queryClient.invalidateQueries({ queryKey: invoiceQueries.lists() });
  void queryClient.invalidateQueries({ queryKey: invoiceQueries.summary().queryKey });
  void queryClient.invalidateQueries({ queryKey: dashboardQueries.all() });
  void queryClient.invalidateQueries({ queryKey: reportQueries.all() });
}

/** Save a draft: a new one is created (and numbered); an existing one is replaced. */
export function useSaveInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: InvoiceInput }) =>
      id ? updateInvoice(id, input) : createInvoice(input),
    onSuccess: (invoice) => settle(queryClient, invoice),
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendInvoice,
    onSuccess: (invoice) => settle(queryClient, invoice),
  });
}

/** A reminder only adds to the invoice's activity, so nothing else needs refetching. */
export function useRemindInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: remindInvoice,
    onSuccess: (invoice) => settle(queryClient, invoice, { figures: false }),
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PaymentInput }) => recordPayment(id, input),
    onSuccess: (invoice) => settle(queryClient, invoice),
  });
}
