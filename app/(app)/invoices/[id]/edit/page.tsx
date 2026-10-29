import type { Metadata } from "next";
import { RouteParams } from "@/components/data/route-params";
import { InvoiceBuilder } from "@/components/invoices/invoice-builder";

export const metadata: Metadata = { title: "Edit invoice" };

// No generateStaticParams: invoice ids live behind the API, so the build
// prerenders one shell for every id, and the builder reads it in the browser.
export default function EditInvoicePage({ params }: PageProps<"/invoices/[id]/edit">) {
  return (
    <RouteParams params={params}>
      <InvoiceBuilder mode="edit" />
    </RouteParams>
  );
}
