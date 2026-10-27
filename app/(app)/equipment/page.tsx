import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/layout/section-placeholder";

export const metadata: Metadata = { title: "Equipment" };

export default function EquipmentPage() {
  return <SectionPlaceholder href="/equipment" />;
}
