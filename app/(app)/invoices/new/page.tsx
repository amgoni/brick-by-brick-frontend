import type { Metadata } from "next";
import { InvoiceBuilder } from "@/components/invoices/invoice-builder";

export const metadata: Metadata = { title: "New invoice" };

export default function NewInvoicePage() {
  return <InvoiceBuilder mode="new" />;
}
