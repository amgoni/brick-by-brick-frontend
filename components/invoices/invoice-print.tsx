"use client";

import { useSuspenseQueries } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { QueryBoundary } from "@/components/data/query-boundary";
import { useRouteParam } from "@/components/data/route-params";
import { documentFromInvoice, InvoiceDocument } from "@/components/invoices/invoice-document";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { invoiceQueries } from "@/lib/queries/invoices";

/**
 * An invoice on its own, ready to print, which is also how it becomes a PDF:
 * "Save as PDF" is one of the print dialog's printers. Always light, like
 * paper, whatever the app's theme. The dialog opens by itself once the
 * invoice has drawn; the toolbar (which doesn't print) opens it again.
 *
 * A stand-in until the backend renders PDFs itself, which it will need to
 * do anyway to attach them to emails.
 */
export function InvoicePrint() {
  return (
    <div data-theme="light" className="min-h-dvh bg-surface-muted text-ink print:bg-surface">
      <style>{"@page { size: A4; margin: 14mm; }"}</style>
      <QueryBoundary fallback={<PrintSkeleton />}>
        <PrintableInvoice />
      </QueryBoundary>
    </div>
  );
}

function Toolbar({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 print:hidden">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/invoices">
          <ArrowLeft />
          Invoices
        </Link>
      </Button>
      {children}
    </div>
  );
}

function PrintSkeleton() {
  return (
    <>
      <Toolbar />
      <div className="mx-auto max-w-[210mm] p-4">
        <Skeleton className="h-[297mm] max-h-[80dvh] rounded-xl" />
      </div>
    </>
  );
}

function PrintableInvoice() {
  const id = useRouteParam("id");
  const [{ data: invoice }, { data: settings }] = useSuspenseQueries({
    queries: [invoiceQueries.detail(id), invoiceQueries.settings()],
  });

  // The title is what "Save as PDF" names the file: "INV-2026-0131 · Crestview Holdings Ltd.pdf".
  const title = `${invoice.number} · ${invoice.client.name}`;
  useEffect(() => {
    document.title = title;
  }, [title]);

  // A beat after it draws, so fonts are in before the print preview is taken.
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Toolbar>
        <Button variant="primary" size="sm" onClick={() => window.print()}>
          <Printer />
          Print or save as PDF
        </Button>
      </Toolbar>
      <main className="mx-auto max-w-[210mm] p-4 print:max-w-none print:p-0">
        <InvoiceDocument
          invoice={documentFromInvoice(invoice)}
          company={settings.company}
          className="print:rounded-none print:border-0 print:p-0"
        />
      </main>
    </>
  );
}
