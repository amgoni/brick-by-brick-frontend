import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/layout/section-placeholder";

export const metadata: Metadata = { title: "Inventory" };

export default function InventoryPage() {
  return <SectionPlaceholder href="/inventory" />;
}
