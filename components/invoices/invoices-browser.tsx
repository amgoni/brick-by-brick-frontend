"use client";

import { Download, Plus, Receipt } from "lucide-react";
import Link from "next/link";
import { useDeferredValue } from "react";
import { QueryBoundary } from "@/components/data/query-boundary";
import { InvoiceDrawer } from "@/components/invoices/invoice-drawer";
import { useInvoiceParams } from "@/components/invoices/invoice-params";
import {
  formatAmount,
  INVOICE_STATUS,
  InvoiceStatusBadge,
  STATUS_ORDER,
} from "@/components/invoices/invoice-status";
import { BrowserOnly } from "@/components/ui/browser-only";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { invoiceExportUrl } from "@/lib/api/invoices";
import type { Invoice, InvoiceStatus } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import {
  daysBetween,
  formatCount,
  formatDate,
  formatMoneyCompact,
  formatMonth,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { useInvoices, useInvoiceSummary } from "@/lib/queries/invoices";

/*
 * Invoices are the first list that grows without end (a firm raises a
 * hundred and fifty a year), so unlike projects and stock it isn't loaded
 * whole. The server filters by status and sends ten at a time, newest first;
 * "Load more" asks for the next ten. The figures over it come from their own
 * request, worked out across every invoice, not just the loaded ones.
 */

/** The Invoices page. Filter and open invoice live in the URL (see useInvoiceParams). */
export function InvoicesBrowser() {
  return (
    <>
      <PageHeader
        title="Invoices"
        description="Progress billing to clients and instalments from property buyers."
        actions={
          <>
            <BrowserOnly fallback={<ExportButton />}>
              <ExportInvoices />
            </BrowserOnly>
            <Button variant="primary" asChild>
              <Link href="/invoices/new">
                <Plus />
                New invoice
              </Link>
            </Button>
          </>
        }
      />

      <section aria-label="Receivables summary">
        <QueryBoundary fallback={<SummarySkeleton />}>
          <SummaryTiles />
        </QueryBoundary>
      </section>

      <QueryBoundary fallback={<ListSkeleton />}>
        <InvoiceResults />
      </QueryBoundary>

      <BrowserOnly fallback={null}>
        <InvoiceDrawer />
      </BrowserOnly>
    </>
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

function ExportButton({ href }: { href?: string }) {
  if (!href) {
    return (
      <Button disabled>
        <Download />
        Export
      </Button>
    );
  }
  // A plain link the browser downloads: the server builds the file from every
  // matching invoice, not only the pages loaded here.
  return (
    <Button asChild>
      <a href={href} download>
        <Download />
        Export
      </a>
    </Button>
  );
}

/** Exports what the filter shows: all invoices, or only the overdue ones. */
function ExportInvoices() {
  const { status } = useInvoiceParams();
  return <ExportButton href={invoiceExportUrl(status)} />;
}

// ---------------------------------------------------------------------------
// The figures
// ---------------------------------------------------------------------------

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-xl border border-line px-4.5 py-4">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3.5 w-44" />
        </div>
      ))}
    </div>
  );
}

function SummaryTiles() {
  const { data: summary } = useInvoiceSummary();
  const { outstanding, overdue, collected, drafts } = summary;
  const oldest = overdue.oldestDueDate && daysBetween(overdue.oldestDueDate, new Date());

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Outstanding"
        value={
          <span title={formatAmount(outstanding.amount)}>
            {formatMoneyCompact(outstanding.amount)}
          </span>
        }
        footer={`${formatCount(outstanding.count, "invoice")} awaiting payment`}
      />
      <StatCard
        label="Overdue"
        value={
          <span
            title={formatAmount(overdue.amount)}
            className={cn(overdue.count > 0 && "text-danger")}
          >
            {formatMoneyCompact(overdue.amount)}
          </span>
        }
        footer={
          overdue.count > 0
            ? `${formatCount(overdue.count, "invoice")} · oldest ${formatCount(oldest || 0, "day")}`
            : "Nothing past its due date"
        }
      />
      <StatCard
        label={`Collected in ${formatMonth(collected.month, "name")}`}
        value={
          <span title={formatAmount(collected.amount)}>{formatMoneyCompact(collected.amount)}</span>
        }
        footer={
          collected.invoiced > 0
            ? `${formatPercent(collected.amount / collected.invoiced)} of the amount invoiced this month`
            : "Nothing invoiced yet this month"
        }
      />
      <StatCard
        label="Drafts"
        value={<span title={formatAmount(drafts.amount)}>{formatMoneyCompact(drafts.amount)}</span>}
        footer={`${formatCount(drafts.count, "invoice")} not yet sent`}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// The list
// ---------------------------------------------------------------------------

type StatusFilter = InvoiceStatus | "all";

function StatusChips({
  value,
  onValueChange,
  counts,
}: {
  value: StatusFilter;
  onValueChange: (value: StatusFilter) => void;
  counts?: Record<InvoiceStatus, number>;
}) {
  const total = counts && STATUS_ORDER.reduce((sum, status) => sum + counts[status], 0);
  return (
    <ChipGroup
      value={value}
      onValueChange={(next) => onValueChange(next as StatusFilter)}
      aria-label="Filter by status"
      className="max-md:scrollbar-none max-md:flex-nowrap max-md:overflow-x-auto"
    >
      <Chip value="all" count={total}>
        All
      </Chip>
      {STATUS_ORDER.map((status) => (
        <Chip key={status} value={status} count={counts?.[status]}>
          {INVOICE_STATUS[status].label}
        </Chip>
      ))}
    </ChipGroup>
  );
}

/** The counts come from the summary; the chips work before it arrives, and without it. */
function CountedStatusChips(props: {
  value: StatusFilter;
  onValueChange: (value: StatusFilter) => void;
}) {
  const { data: summary } = useInvoiceSummary();
  return <StatusChips {...props} counts={summary.counts} />;
}

function ListSkeleton() {
  return (
    <>
      <div className="flex gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-11 w-24 rounded-full md:h-8.5" />
        ))}
      </div>
      <Card>
        <TableSkeleton rows={10} columns={7} />
      </Card>
    </>
  );
}

function InvoiceResults() {
  const { status, setStatus } = useInvoiceParams();
  // The chips answer at once; the list keeps showing the last filter's rows
  // (dimmed) until the server's answer for the new one is in.
  const shownStatus = useDeferredValue(status);
  const stale = shownStatus !== status;

  const value: StatusFilter = status ?? "all";
  const onValueChange = (next: StatusFilter) => setStatus(next === "all" ? undefined : next);
  const chips = <StatusChips value={value} onValueChange={onValueChange} />;

  return (
    <>
      <QueryBoundary fallback={chips} errorFallback={() => chips}>
        <CountedStatusChips value={value} onValueChange={onValueChange} />
      </QueryBoundary>
      <Card className={cn("transition-opacity", stale && "opacity-60")} aria-busy={stale}>
        <InvoiceList status={shownStatus} />
      </Card>
    </>
  );
}

const shortDate = (invoice: Invoice, date: string) =>
  invoice.status === "draft" ? "—" : formatDate(date);

/** "Ibadan Ring Road Plaza · Valuation 3" */
const describe = (invoice: Invoice) =>
  [invoice.project?.name, invoice.reference].filter(Boolean).join(" · ");

/** Where an invoice stands, for the phone list's last line: "Due 19 Nov 2026 · ₦38,900,000 left". */
function standing(invoice: Invoice): string {
  if (invoice.status === "draft") return "Not sent yet";
  if (invoice.status === "paid") return "Paid in full";
  const due = `Due ${formatDate(invoice.dueOn)}`;
  return invoice.paid > 0 ? `${due} · ${formatAmount(invoice.balance)} left` : due;
}

function InvoiceList({ status }: { status: InvoiceStatus | undefined }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInvoices({ status });
  const { openInvoice, invoiceHref } = useInvoiceParams();
  const invoices = data.pages.flatMap((page) => page.items);
  const total = data.pages[0]?.total ?? 0;

  if (invoices.length === 0) {
    return status ? (
      <EmptyState
        icon={<Receipt />}
        title={`No ${INVOICE_STATUS[status].label.toLowerCase()} invoices`}
        description="Pick another status to see the rest."
      />
    ) : (
      <EmptyState
        icon={<Receipt />}
        title="No invoices yet"
        description="Valuations to clients and instalments from buyers show here once they're raised."
        action={
          <Button size="sm" asChild>
            <Link href="/invoices/new">
              <Plus />
              New invoice
            </Link>
          </Button>
        }
      />
    );
  }

  /** A real link (it opens in a new tab too); a plain click opens the drawer over the list. */
  const link = (invoice: Invoice, className: string, children: React.ReactNode) => (
    <a
      href={invoiceHref(invoice.id)}
      onClick={(event) => {
        // The row behind it opens the drawer too; a new-tab click shouldn't.
        event.stopPropagation();
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        openInvoice(invoice.id);
      }}
      className={className}
    >
      {children}
    </a>
  );

  return (
    <>
      <ul className="md:hidden">
        {invoices.map((invoice) => (
          <li key={invoice.id} className="border-b border-line last:border-b-0">
            {link(
              invoice,
              "flex flex-col gap-1 px-4.5 py-3.5 transition-colors hover:bg-hover",
              <>
                <span className="flex items-start justify-between gap-3">
                  <span className="font-medium">{invoice.client.name}</span>
                  <InvoiceStatusBadge invoice={invoice} />
                </span>
                <span className="text-sm text-ink-3">
                  <span className="font-mono text-xs">{invoice.number}</span> · {describe(invoice)}
                </span>
                <span className="flex items-baseline justify-between gap-3 text-md">
                  <span className="text-ink-2">{standing(invoice)}</span>
                  <span className="font-medium tabular-nums">{formatAmount(invoice.total)}</span>
                </span>
              </>,
            )}
          </li>
        ))}
      </ul>

      <Table className="min-w-260 max-md:hidden">
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Billed to</TableHead>
            <TableHead>Issued</TableHead>
            <TableHead>Due</TableHead>
            <TableHead numeric>Amount</TableHead>
            <TableHead numeric>Balance</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            // The whole row opens the invoice; the number is the link a keyboard reaches.
            <TableRow
              key={invoice.id}
              onClick={() => openInvoice(invoice.id)}
              className="cursor-pointer"
            >
              <TableCell className="font-mono text-sm whitespace-nowrap text-ink-2">
                {link(invoice, "rounded-sm hover:text-ink", invoice.number)}
              </TableCell>
              <TableCell className="py-2.5">
                <div className="font-medium">{invoice.client.name}</div>
                <div className="text-sm text-ink-3">{describe(invoice)}</div>
              </TableCell>
              <TableCell className="whitespace-nowrap text-ink-2 tabular-nums">
                {shortDate(invoice, invoice.issuedOn)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-ink-2 tabular-nums">
                {shortDate(invoice, invoice.dueOn)}
              </TableCell>
              <TableCell numeric>{formatAmount(invoice.total)}</TableCell>
              <TableCell numeric className="font-medium">
                {/* A draft owes nothing yet: it hasn't been sent. */}
                {invoice.status === "draft" ? "—" : formatAmount(invoice.balance)}
              </TableCell>
              <TableCell>
                <InvoiceStatusBadge invoice={invoice} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4.5 py-3 text-sm text-ink-3">
        <span aria-live="polite">
          Showing {formatNumber(invoices.length)} of{" "}
          {formatCount(
            total,
            status ? `${INVOICE_STATUS[status].label.toLowerCase()} invoice` : "invoice",
          )}
        </span>
        {hasNextPage && (
          <Button size="sm" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
            Load more
          </Button>
        )}
      </div>
    </>
  );
}
