"use client";

import { Bell, FileDown } from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { QueryBoundary } from "@/components/data/query-boundary";
import { useInvoiceParams } from "@/components/invoices/invoice-params";
import {
  formatAmount,
  formatTerms,
  InvoiceStatusBadge,
} from "@/components/invoices/invoice-status";
import { RecordPaymentDialog } from "@/components/invoices/record-payment-dialog";
import { Button } from "@/components/ui/button";
import { DescriptionItem, DescriptionList } from "@/components/ui/description-list";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Timeline, TimelineItem, TimelineMeta, TimelineTitle } from "@/components/ui/timeline";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";
import type { InvoiceDetail } from "@/lib/api/types";
import { formatDate, formatDateTime } from "@/lib/format";
import { useInvoice, useRemindInvoice } from "@/lib/queries/invoices";

/**
 * One invoice over the list, opened by `?invoice=` in the URL: its figures,
 * terms, what's happened to it, and what can be done next (edit a draft;
 * chase or record a payment against one that's owed).
 */
export function InvoiceDrawer() {
  const { invoiceId, closeInvoice } = useInvoiceParams();
  // Keep showing the last invoice while the drawer slides shut.
  const [shownId, setShownId] = useState(invoiceId);
  if (invoiceId && invoiceId !== shownId) setShownId(invoiceId);

  return (
    <Sheet open={Boolean(invoiceId)} onOpenChange={(open) => !open && closeInvoice()}>
      <SheetContent aria-describedby={undefined}>
        {shownId && (
          <QueryBoundary fallback={<DrawerSkeleton />}>
            <InvoiceDetails id={shownId} />
          </QueryBoundary>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DrawerSkeleton() {
  return (
    <>
      <SheetHeader>
        <SheetTitle className="sr-only">Invoice</SheetTitle>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-56" />
      </SheetHeader>
      <SheetBody>
        <Skeleton className="h-18 w-full rounded-xl" />
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
      </SheetBody>
    </>
  );
}

const owes = (invoice: InvoiceDetail) =>
  invoice.status === "sent" || invoice.status === "part_paid" || invoice.status === "overdue";

function InvoiceDetails({ id }: { id: string }) {
  const { data: invoice } = useInvoice(id);
  const remind = useRemindInvoice();
  const [paying, setPaying] = useState(false);
  const draft = invoice.status === "draft";

  // The page stays mounted when you leave it; a dialog left open shouldn't greet you on return.
  useLayoutEffect(() => () => setPaying(false), []);

  const sendReminder = () =>
    remind.mutate(invoice.id, {
      onSuccess: (updated) => toast.success(`Reminder emailed to ${updated.sendTo}`),
      onError: (error) =>
        toast.error("The reminder wasn't sent", {
          description:
            error instanceof ApiError ? error.message : "Something went wrong. Try again.",
        }),
    });

  return (
    <>
      <SheetHeader className="gap-1.5">
        <span className="font-mono text-sm text-ink-3">{invoice.number}</span>
        <SheetTitle>{invoice.client.name}</SheetTitle>
        <div>
          <InvoiceStatusBadge invoice={invoice} />
        </div>
      </SheetHeader>

      <SheetBody className="gap-5">
        <dl className="grid grid-cols-3 gap-3 rounded-xl border border-line p-4">
          {[
            ["Amount", invoice.total],
            ["Paid", invoice.paid],
            ["Balance", invoice.balance],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-sm text-ink-3">{label}</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">{formatAmount(value as number)}</dd>
            </div>
          ))}
        </dl>

        <DescriptionList>
          <DescriptionItem label="For">
            {[invoice.project?.name, invoice.reference].filter(Boolean).join(" · ")}
          </DescriptionItem>
          <DescriptionItem label="Issued">
            {draft
              ? `Not sent yet (dated ${formatDate(invoice.issuedOn)})`
              : formatDate(invoice.issuedOn)}
          </DescriptionItem>
          <DescriptionItem label="Due">{draft ? "—" : formatDate(invoice.dueOn)}</DescriptionItem>
          <DescriptionItem label="Terms">{formatTerms(invoice.paymentTermsDays)}</DescriptionItem>
          <DescriptionItem label="Send to">{invoice.sendTo}</DescriptionItem>
          {invoice.clientReference && (
            <DescriptionItem label="Client ref.">
              <span className="font-mono text-sm">{invoice.clientReference}</span>
            </DescriptionItem>
          )}
        </DescriptionList>

        <section aria-labelledby="invoice-activity" className="flex flex-col gap-3">
          <h3 id="invoice-activity" className="text-md font-semibold">
            Activity
          </h3>
          <Timeline>
            {invoice.activity.map((event) => (
              <TimelineItem key={event.id}>
                <TimelineTitle>{event.title}</TimelineTitle>
                <TimelineMeta>
                  {formatDateTime(event.at)}
                  {event.by && ` · ${event.by.name}`}
                </TimelineMeta>
                {event.detail && <p className="text-sm text-ink-2">{event.detail}</p>}
              </TimelineItem>
            ))}
          </Timeline>
        </section>
      </SheetBody>

      <SheetFooter>
        <Button asChild>
          {/* The print page; the browser's print dialog saves it as a PDF. */}
          <a href={`/invoices/${invoice.id}/print`} target="_blank" rel="noopener">
            <FileDown />
            PDF
          </a>
        </Button>
        {draft && (
          <Button variant="primary" asChild>
            <Link href={`/invoices/${invoice.id}/edit`}>Continue editing</Link>
          </Button>
        )}
        {owes(invoice) && (
          <>
            <Button onClick={sendReminder} loading={remind.isPending}>
              {!remind.isPending && <Bell />}
              Send reminder
            </Button>
            <Button variant="primary" onClick={() => setPaying(true)}>
              Record payment
            </Button>
          </>
        )}
      </SheetFooter>

      {/*
       * Mounted whatever the status: a payment that clears the balance makes the
       * invoice "paid" before the dialog has had its answer, and an unmounted
       * dialog would never close or say so.
       */}
      <RecordPaymentDialog invoice={invoice} open={paying} onOpenChange={setPaying} />
    </>
  );
}
