import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/layout/section-placeholder";

export const metadata: Metadata = { title: "Suppliers" };

export default function SuppliersPage() {
  return <SectionPlaceholder href="/suppliers" />;
}
