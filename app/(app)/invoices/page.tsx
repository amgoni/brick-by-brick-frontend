import type { Metadata } from "next";
import { InvoicesBrowser } from "@/components/invoices/invoices-browser";

export const metadata: Metadata = { title: "Invoices" };

export default function InvoicesPage() {
  return <InvoicesBrowser />;
}
