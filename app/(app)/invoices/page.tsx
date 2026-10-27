import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/layout/section-placeholder";

export const metadata: Metadata = { title: "Invoices" };

export default function InvoicesPage() {
  return <SectionPlaceholder href="/invoices" />;
}
