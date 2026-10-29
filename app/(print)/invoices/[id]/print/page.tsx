import type { Metadata } from "next";
import { RouteParams } from "@/components/data/route-params";
import { InvoicePrint } from "@/components/invoices/invoice-print";

export const metadata: Metadata = { title: "Invoice" };

/*
 * Outside the (app) group, so it has no shell: a page that's only an
 * invoice, for printing and saving as a PDF.
 */
export default function InvoicePrintPage({ params }: PageProps<"/invoices/[id]/print">) {
  return (
    <RouteParams params={params}>
      <InvoicePrint />
    </RouteParams>
  );
}
